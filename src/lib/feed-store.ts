import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  feedEnforcementEvents,
  feedModerationResults,
  feedPosts,
  feedReports,
  feedVotes,
} from "@/db/schema";
import {
  FEED_BURST_LIMIT,
  FEED_BURST_WINDOW_MS,
  FEED_POST_MAX,
  FEED_POSTS_PER_HOUR,
  FEED_POSTS_PER_HOUR_NEW,
  FEED_REPLIES_PER_HOUR,
  FEED_REPORT_HIDE_COUNT,
  FEED_REPORT_HIDE_WINDOW_MS,
} from "@/lib/config";
import { serviceDayWindow } from "@/lib/dates";
import {
  getOrCreateFeedIdentity,
  identityIsNew,
  maybePromoteIdentity,
  type FeedIdentity,
} from "@/lib/feed-identity";
import {
  feedRejectMessage,
  moderateFeedText,
} from "@/lib/feed-moderation";
import { canPostToRoom } from "@/lib/feed-presence";
import { isoRequired } from "@/lib/money";
import { ensureFeedTables } from "@/lib/feed-schema";
import {
  FEED_REPORT_REASONS,
  type FeedPostView,
  type FeedReportReason,
} from "@/lib/feed-types";
import type { PawRecord } from "@/lib/paws";
import { tableForDeviceTonight } from "@/lib/night-tables";

export { FEED_REPORT_REASONS, type FeedPostView, type FeedReportReason };

export type FeedWriteError = {
  ok: false;
  status: number;
  error: string;
  reason: string;
};

export type FeedWriteOk = {
  ok: true;
  post: FeedPostView;
};

function trimBody(raw: unknown) {
  if (typeof raw !== "string") return null;
  const body = raw.replace(/\s+/g, " ").trim();
  if (body.length < 1 || body.length > FEED_POST_MAX) return null;
  return body;
}

function mapView(
  row: typeof feedPosts.$inferSelect,
  identityId: string | null,
  replies: FeedPostView[] = [],
  myVote: "up" | "down" | null = null,
): FeedPostView {
  return {
    id: row.id,
    body: row.body,
    handle: row.handleSnapshot,
    createdAt: isoRequired(row.createdAt),
    replyCount: row.replyCount,
    parentId: row.parentPostId,
    mine: Boolean(identityId) && row.identityId === identityId,
    upvoteCount: row.upvoteCount,
    downvoteCount: row.downvoteCount,
    myVote,
    replies,
    authorKind: row.authorKind === "house" ? "house" : "human",
  };
}

async function votesByPost(identityId: string | null, ids: string[]) {
  const mine = new Map<string, "up" | "down">();
  if (!identityId || ids.length === 0) return mine;
  const rows = await db()
    .select()
    .from(feedVotes)
    .where(
      and(eq(feedVotes.identityId, identityId), inArray(feedVotes.postId, ids)),
    );
  for (const row of rows) {
    if (row.voteType === "up" || row.voteType === "down") {
      mine.set(row.postId, row.voteType);
    }
  }
  return mine;
}

async function activeCooldown(identityId: string) {
  const now = new Date();
  const rows = await db()
    .select()
    .from(feedEnforcementEvents)
    .where(eq(feedEnforcementEvents.identityId, identityId));
  return rows.find(
    (row) =>
      (row.eventType === "cooldown" ||
        row.eventType === "suspended" ||
        row.eventType === "banned") &&
      (!row.expiresAt || row.expiresAt > now),
  );
}

async function countRecent(
  identityId: string,
  since: Date,
  originalsOnly: boolean,
) {
  const rows = await db()
    .select({ id: feedPosts.id, parentPostId: feedPosts.parentPostId })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.identityId, identityId), gt(feedPosts.createdAt, since)),
    );
  return originalsOnly
    ? rows.filter((row) => !row.parentPostId).length
    : rows.filter((row) => row.parentPostId).length;
}

async function countBurst(identityId: string) {
  const since = new Date(Date.now() - FEED_BURST_WINDOW_MS);
  const rows = await db()
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.identityId, identityId), gt(feedPosts.createdAt, since)),
    );
  return rows.length;
}

async function checkRate(identity: FeedIdentity, isReply: boolean) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if ((await countBurst(identity.id)) >= FEED_BURST_LIMIT) {
    return false;
  }
  if (isReply) {
    return (await countRecent(identity.id, hourAgo, false)) < FEED_REPLIES_PER_HOUR;
  }
  const cap = identityIsNew(identity)
    ? FEED_POSTS_PER_HOUR_NEW
    : FEED_POSTS_PER_HOUR;
  return (await countRecent(identity.id, hourAgo, true)) < cap;
}

async function recordEnforcement(
  identityId: string,
  postId: string | null,
  eventType: string,
  reason: string,
  expiresAt?: Date,
) {
  await db().insert(feedEnforcementEvents).values({
    id: randomUUID(),
    identityId,
    postId,
    eventType,
    reason,
    expiresAt: expiresAt ?? null,
  });
}

async function rejectedRecently(identityId: string) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db()
    .select()
    .from(feedEnforcementEvents)
    .where(
      and(
        eq(feedEnforcementEvents.identityId, identityId),
        eq(feedEnforcementEvents.eventType, "rejected"),
        gt(feedEnforcementEvents.createdAt, hourAgo),
      ),
    );
  return rows.length;
}

export async function listRoomPosts(
  paw: PawRecord,
  identityId: string | null,
  limit = 40,
) {
  await ensureFeedTables();
  const window = serviceDayWindow(paw.timezone);
  const tops = await db()
    .select()
    .from(feedPosts)
    .where(
      and(
        eq(feedPosts.hostId, paw.hostId),
        eq(feedPosts.status, "published"),
        isNull(feedPosts.parentPostId),
        gte(feedPosts.createdAt, window.start),
        lt(feedPosts.createdAt, window.end),
      ),
    )
    .orderBy(desc(feedPosts.createdAt))
    .limit(limit);

  if (tops.length === 0) return [] as FeedPostView[];

  const ids = tops.map((row) => row.id);
  const replyRows =
    ids.length === 0
      ? []
      : await db()
          .select()
          .from(feedPosts)
          .where(
            and(
              eq(feedPosts.status, "published"),
              inArray(feedPosts.parentPostId, ids),
            ),
          )
          .orderBy(feedPosts.createdAt);

  const byParent = new Map<string, typeof feedPosts.$inferSelect[]>();
  for (const row of replyRows) {
    if (!row.parentPostId) continue;
    const list = byParent.get(row.parentPostId) ?? [];
    list.push(row);
    byParent.set(row.parentPostId, list);
  }

  const replyIds = replyRows.map((row) => row.id);
  const mine = await votesByPost(identityId, [...ids, ...replyIds]);

  return tops.map((row) =>
    mapView(
      row,
      identityId,
      (byParent.get(row.id) ?? []).map((reply) =>
        mapView(reply, identityId, [], mine.get(reply.id) ?? null),
      ),
      mine.get(row.id) ?? null,
    ),
  );
}

export async function createRoomPost(input: {
  paw: PawRecord;
  body: unknown;
  parentPostId?: unknown;
}): Promise<FeedWriteOk | FeedWriteError> {
  await ensureFeedTables();
  const identity = await getOrCreateFeedIdentity();
  await maybePromoteIdentity(identity);
  const sitting = await tableForDeviceTonight(input.paw, identity.deviceKey);
  const byline = sitting?.name || identity.publicHandle;

  if (!(await canPostToRoom(input.paw))) {
    return {
      ok: false,
      status: 403,
      reason: "presence",
      error: feedRejectMessage("presence"),
    };
  }

  const paused = await activeCooldown(identity.id);
  if (paused || identity.postingStatus === "banned") {
    const reason = paused?.eventType ?? "banned";
    return {
      ok: false,
      status: 403,
      reason,
      error: feedRejectMessage(reason),
    };
  }

  const body = trimBody(input.body);
  if (!body) {
    return {
      ok: false,
      status: 400,
      reason: "body",
      error: `Say something, up to ${FEED_POST_MAX} characters.`,
    };
  }

  let parentId: string | null = null;
  if (input.parentPostId != null && input.parentPostId !== "") {
    if (typeof input.parentPostId !== "string") {
      return {
        ok: false,
        status: 400,
        reason: "parent",
        error: "Couldn’t find that thread.",
      };
    }
    const [parent] = await db()
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.id, input.parentPostId))
      .limit(1);
    if (
      !parent ||
      parent.hostId !== input.paw.hostId ||
      parent.status !== "published" ||
      parent.parentPostId
    ) {
      return {
        ok: false,
        status: 400,
        reason: "parent",
        error: "Couldn’t find that thread.",
      };
    }
    parentId = parent.id;
  }

  if (!(await checkRate(identity, Boolean(parentId)))) {
    return {
      ok: false,
      status: 429,
      reason: "rate",
      error: feedRejectMessage("rate"),
    };
  }

  const moderation = await moderateFeedText(body);
  const postId = randomUUID();
  const published = moderation.decision === "allow";
  const status = published ? "published" : "blocked";

  await db().insert(feedPosts).values({
    id: postId,
    hostId: input.paw.hostId,
    pawToken: input.paw.token,
    identityId: identity.id,
    handleSnapshot: byline,
    body,
    parentPostId: parentId,
    status,
  });

  await db().insert(feedModerationResults).values({
    id: randomUUID(),
    postId,
    piiDetected: moderation.piiDetected,
    piiTypes: moderation.piiTypes,
    omniFlagged: moderation.omniFlagged,
    omniCategoryScoresJson: moderation.scores,
    decision: moderation.decision,
    decisionReason: moderation.decisionReason,
    wouldDecision: moderation.wouldDecision,
  });

  if (!published) {
    await recordEnforcement(
      identity.id,
      postId,
      moderation.decision === "unavailable" ? "unavailable" : "rejected",
      moderation.decisionReason,
    );
    const rejects = await rejectedRecently(identity.id);
    if (rejects >= 3) {
      await recordEnforcement(
        identity.id,
        postId,
        "cooldown",
        "repeat_reject",
        new Date(Date.now() + 30 * 60 * 1000),
      );
    }
    return {
      ok: false,
      status: moderation.decision === "unavailable" ? 503 : 400,
      reason: moderation.decisionReason,
      error: feedRejectMessage(moderation.decisionReason),
    };
  }

  if (parentId) {
    await db()
      .update(feedPosts)
      .set({
        replyCount: sql`${feedPosts.replyCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(feedPosts.id, parentId));
  }

  const [row] = await db()
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, postId))
    .limit(1);
  return { ok: true, post: mapView(row!, identity.id) };
}

export async function deleteOwnPost(input: { paw: PawRecord; postId: string }) {
  await ensureFeedTables();
  const identity = await getOrCreateFeedIdentity();
  const [row] = await db()
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, input.postId))
    .limit(1);
  if (!row || row.hostId !== input.paw.hostId) {
    return { ok: false as const, status: 404, error: "Not found." };
  }
  if (row.identityId !== identity.id) {
    return { ok: false as const, status: 403, error: "That’s not yours." };
  }
  if (row.status === "deleted_by_author") {
    return { ok: true as const };
  }
  await db()
    .update(feedPosts)
    .set({ status: "deleted_by_author", updatedAt: new Date() })
    .where(eq(feedPosts.id, row.id));
  return { ok: true as const };
}

export async function reportRoomPost(input: {
  paw: PawRecord;
  postId: string;
  reason: unknown;
}) {
  await ensureFeedTables();
  const identity = await getOrCreateFeedIdentity();
  const reason =
    typeof input.reason === "string" &&
    (FEED_REPORT_REASONS as readonly string[]).includes(input.reason)
      ? (input.reason as FeedReportReason)
      : null;
  if (!reason) {
    return { ok: false as const, status: 400, error: "Pick a reason." };
  }
  const [post] = await db()
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, input.postId))
    .limit(1);
  if (!post || post.hostId !== input.paw.hostId) {
    return { ok: false as const, status: 404, error: "Not found." };
  }
  if (post.identityId === identity.id) {
    return { ok: false as const, status: 400, error: "That’s yours." };
  }

  try {
    await db().insert(feedReports).values({
      id: randomUUID(),
      postId: post.id,
      reporterIdentityId: identity.id,
      reason,
    });
  } catch {
    return { ok: true as const };
  }

  const since = new Date(Date.now() - FEED_REPORT_HIDE_WINDOW_MS);
  const reports = await db()
    .select()
    .from(feedReports)
    .where(
      and(eq(feedReports.postId, post.id), gt(feedReports.createdAt, since)),
    );
  const reporters = new Set(reports.map((row) => row.reporterIdentityId));
  if (reporters.size >= FEED_REPORT_HIDE_COUNT && post.status === "published") {
    await db()
      .update(feedPosts)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(eq(feedPosts.id, post.id));
    await recordEnforcement(post.identityId, post.id, "hidden", "reports");
  }

  return { ok: true as const };
}

export async function voteRoomPost(input: {
  paw: PawRecord;
  postId: string;
  vote: unknown;
}) {
  await ensureFeedTables();
  const identity = await getOrCreateFeedIdentity();
  const vote = input.vote === "up" || input.vote === "down" ? input.vote : null;
  if (!vote) {
    return { ok: false as const, status: 400, error: "Up or down." };
  }
  const [post] = await db()
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, input.postId))
    .limit(1);
  if (!post || post.hostId !== input.paw.hostId || post.status !== "published") {
    return { ok: false as const, status: 404, error: "Not found." };
  }

  const [existing] = await db()
    .select()
    .from(feedVotes)
    .where(
      and(eq(feedVotes.postId, post.id), eq(feedVotes.identityId, identity.id)),
    )
    .limit(1);

  if (existing?.voteType === vote) {
    await db().delete(feedVotes).where(eq(feedVotes.id, existing.id));
    await db()
      .update(feedPosts)
      .set(
        vote === "up"
          ? { upvoteCount: sql`GREATEST(${feedPosts.upvoteCount} - 1, 0)` }
          : { downvoteCount: sql`GREATEST(${feedPosts.downvoteCount} - 1, 0)` },
      )
      .where(eq(feedPosts.id, post.id));
    return { ok: true as const, myVote: null as "up" | "down" | null };
  }

  if (existing) {
    await db()
      .update(feedVotes)
      .set({ voteType: vote })
      .where(eq(feedVotes.id, existing.id));
    await db()
      .update(feedPosts)
      .set(
        vote === "up"
          ? {
              upvoteCount: sql`${feedPosts.upvoteCount} + 1`,
              downvoteCount: sql`GREATEST(${feedPosts.downvoteCount} - 1, 0)`,
            }
          : {
              downvoteCount: sql`${feedPosts.downvoteCount} + 1`,
              upvoteCount: sql`GREATEST(${feedPosts.upvoteCount} - 1, 0)`,
            },
      )
      .where(eq(feedPosts.id, post.id));
    return { ok: true as const, myVote: vote };
  }

  await db().insert(feedVotes).values({
    id: randomUUID(),
    postId: post.id,
    identityId: identity.id,
    voteType: vote,
  });
  await db()
    .update(feedPosts)
    .set(
      vote === "up"
        ? { upvoteCount: sql`${feedPosts.upvoteCount} + 1` }
        : { downvoteCount: sql`${feedPosts.downvoteCount} + 1` },
    )
    .where(eq(feedPosts.id, post.id));
  return { ok: true as const, myVote: vote };
}

export async function listModeratedPosts(limit = 80) {
  await ensureFeedTables();
  return db()
    .select()
    .from(feedPosts)
    .orderBy(desc(feedPosts.createdAt))
    .limit(limit);
}

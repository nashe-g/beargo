import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { feedIdentities, feedPosts, houseNights } from "@/db/schema";
import { addCalendarDays, serviceDayInZone, serviceDayWindow } from "@/lib/dates";
import { numberedFeedHandle } from "@/lib/feed-handles";
import { ensureFeedTables } from "@/lib/feed-schema";
import {
  houseResultBody,
  pickHouseDare,
  type HouseSlot,
} from "@/lib/house-copy";
import type { PawRecord } from "@/lib/paws";
import { parsePlayKind, type PlayKind } from "@/lib/play-kind";
import { canPostWithSource, roomPlaySource } from "@/lib/feed-presence";

export const HOUSE_DEVICE_KEY = "house:beargo";
const HOUSE_HANDLE = "The House";

const SECOND_AFTER_MS = 15 * 60 * 1000;
const DEMO_SECOND_AFTER_MS = 60 * 1000;

function mapIdentity(row: typeof feedIdentities.$inferSelect) {
  return {
    id: row.id,
    deviceKey: row.deviceKey,
    publicHandle: row.publicHandle,
  };
}

export async function getOrCreateHouseIdentity() {
  await ensureFeedTables();
  const [existing] = await db()
    .select()
    .from(feedIdentities)
    .where(eq(feedIdentities.deviceKey, HOUSE_DEVICE_KEY))
    .limit(1);
  if (existing) return mapIdentity(existing);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const handle =
      attempt === 0 ? HOUSE_HANDLE : numberedFeedHandle(HOUSE_HANDLE, attempt + 1);
    try {
      const [row] = await db()
        .insert(feedIdentities)
        .values({
          id: randomUUID(),
          deviceKey: HOUSE_DEVICE_KEY,
          publicHandle: handle,
          trustLevel: "normal",
          postingStatus: "ok",
        })
        .returning();
      if (row) return mapIdentity(row);
    } catch {
      const [race] = await db()
        .select()
        .from(feedIdentities)
        .where(eq(feedIdentities.deviceKey, HOUSE_DEVICE_KEY))
        .limit(1);
      if (race) return mapIdentity(race);
    }
  }
  throw new Error("Could not mint the House");
}

async function usedLineIds(hostId: string, sinceDay: string) {
  const rows = await db()
    .select({
      leadLineId: houseNights.leadLineId,
      secondLineId: houseNights.secondLineId,
    })
    .from(houseNights)
    .where(
      and(eq(houseNights.hostId, hostId), gte(houseNights.serviceDay, sinceDay)),
    );
  const ids: string[] = [];
  for (const row of rows) {
    if (row.leadLineId) ids.push(row.leadLineId);
    if (row.secondLineId) ids.push(row.secondLineId);
  }
  return ids;
}

async function lastLeadKind(hostId: string, beforeDay: string) {
  const [row] = await db()
    .select({ leadKind: houseNights.leadKind })
    .from(houseNights)
    .where(
      and(eq(houseNights.hostId, hostId), lt(houseNights.serviceDay, beforeDay)),
    )
    .orderBy(desc(houseNights.serviceDay))
    .limit(1);
  return parsePlayKind(row?.leadKind);
}

function housePostId(hostId: string, serviceDay: string, slot: "lead" | "second") {
  return `house:${hostId}:${serviceDay}:${slot}`;
}

async function insertHousePost(input: {
  paw: PawRecord;
  body: string;
  slot: HouseSlot;
  lineId: string | null;
  playKind: PlayKind | null;
  parentPostId?: string | null;
  id?: string;
}) {
  const house = await getOrCreateHouseIdentity();
  const postId = input.id ?? randomUUID();
  try {
    await db().insert(feedPosts).values({
      id: postId,
      hostId: input.paw.hostId,
      pawToken: input.paw.token,
      identityId: house.id,
      handleSnapshot: house.publicHandle,
      body: input.body,
      parentPostId: input.parentPostId ?? null,
      status: "published",
      authorKind: "house",
      houseSlot: input.slot,
      houseLineId: input.lineId,
      playKind: input.playKind,
    });
  } catch {
    const [existing] = await db()
      .select({ id: feedPosts.id })
      .from(feedPosts)
      .where(eq(feedPosts.id, postId))
      .limit(1);
    if (existing) return existing.id;
    throw new Error("Could not post as the House");
  }
  if (input.parentPostId) {
    await db()
      .update(feedPosts)
      .set({
        replyCount: sql`${feedPosts.replyCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(feedPosts.id, input.parentPostId));
  }
  return postId;
}

async function nightRow(hostId: string, serviceDay: string) {
  const [row] = await db()
    .select()
    .from(houseNights)
    .where(
      and(eq(houseNights.hostId, hostId), eq(houseNights.serviceDay, serviceDay)),
    )
    .limit(1);
  return row ?? null;
}

async function humansPostedSince(paw: PawRecord, since: Date) {
  const [row] = await db()
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(
      and(
        eq(feedPosts.hostId, paw.hostId),
        eq(feedPosts.status, "published"),
        eq(feedPosts.authorKind, "human"),
        gte(feedPosts.createdAt, since),
      ),
    )
    .limit(1);
  return Boolean(row);
}

async function finishLead(paw: PawRecord, night: typeof houseNights.$inferSelect) {
  if (night.leadPostId) return night;
  const plannedId = housePostId(paw.hostId, night.serviceDay, "lead");
  const [already] = await db()
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(eq(feedPosts.id, plannedId))
    .limit(1);
  if (already) {
    const [updated] = await db()
      .update(houseNights)
      .set({ leadPostId: already.id, updatedAt: new Date() })
      .where(and(eq(houseNights.id, night.id), isNull(houseNights.leadPostId)))
      .returning();
    return updated ?? (await nightRow(paw.hostId, night.serviceDay))!;
  }
  const used = await usedLineIds(
    paw.hostId,
    addCalendarDays(night.serviceDay, -7),
  );
  const previous = await lastLeadKind(paw.hostId, night.serviceDay);
  const pick = pickHouseDare({
    slot: "lead",
    lastLeadKind: previous,
    usedLineIds: used,
    venue: paw.hostDisplayName,
  });
  const postId = await insertHousePost({
    paw,
    id: plannedId,
    body: pick.body,
    slot: "lead",
    lineId: pick.lineId,
    playKind: pick.playKind,
  });
  const [updated] = await db()
    .update(houseNights)
    .set({
      leadKind: pick.playKind,
      leadLineId: pick.lineId,
      leadPostId: postId,
      updatedAt: new Date(),
    })
    .where(and(eq(houseNights.id, night.id), isNull(houseNights.leadPostId)))
    .returning();
  return updated ?? (await nightRow(paw.hostId, night.serviceDay))!;
}

async function maybeSecond(paw: PawRecord, night: typeof houseNights.$inferSelect) {
  if (night.secondPostId || !night.leadPostId || !night.leadKind) return night;
  const [lead] = await db()
    .select({ createdAt: feedPosts.createdAt })
    .from(feedPosts)
    .where(eq(feedPosts.id, night.leadPostId))
    .limit(1);
  if (!lead) return night;
  const wait = paw.token === "demo" ? DEMO_SECOND_AFTER_MS : SECOND_AFTER_MS;
  if (Date.now() - lead.createdAt.getTime() < wait) return night;
  if (await humansPostedSince(paw, lead.createdAt)) return night;

  const used = await usedLineIds(
    paw.hostId,
    addCalendarDays(night.serviceDay, -7),
  );
  const pick = pickHouseDare({
    slot: "second",
    lastLeadKind: parsePlayKind(night.leadKind),
    usedLineIds: used,
    venue: paw.hostDisplayName,
  });
  const postId = await insertHousePost({
    paw,
    id: housePostId(paw.hostId, night.serviceDay, "second"),
    body: pick.body,
    slot: "second",
    lineId: pick.lineId,
    playKind: pick.playKind,
  });
  const [updated] = await db()
    .update(houseNights)
    .set({
      secondKind: pick.playKind,
      secondLineId: pick.lineId,
      secondPostId: postId,
      updatedAt: new Date(),
    })
    .where(and(eq(houseNights.id, night.id), isNull(houseNights.secondPostId)))
    .returning();
  return updated ?? night;
}

export async function ensureHouseNight(paw: PawRecord) {
  await ensureFeedTables();
  const serviceDay = serviceDayInZone(paw.timezone);
  let night = await nightRow(paw.hostId, serviceDay);
  if (!night) {
    try {
      const [created] = await db()
        .insert(houseNights)
        .values({
          id: randomUUID(),
          hostId: paw.hostId,
          pawToken: paw.token,
          serviceDay,
        })
        .returning();
      night = created ?? (await nightRow(paw.hostId, serviceDay));
    } catch {
      night = await nightRow(paw.hostId, serviceDay);
    }
  }
  if (!night) return;
  night = await finishLead(paw, night);
  await maybeSecond(paw, night);
}

export async function ensureHouseNightIfPresent(paw: PawRecord) {
  if (!canPostWithSource(paw, await roomPlaySource(paw))) return;
  await ensureHouseNight(paw);
}

export async function postHouseResult(input: {
  paw: PawRecord;
  kind: PlayKind;
  handle: string;
  stackWobble: number;
  correctCount: number;
}) {
  await ensureFeedTables();
  const window = serviceDayWindow(input.paw.timezone);
  const [dare] = await db()
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(
      and(
        eq(feedPosts.hostId, input.paw.hostId),
        eq(feedPosts.authorKind, "house"),
        eq(feedPosts.playKind, input.kind),
        eq(feedPosts.status, "published"),
        isNull(feedPosts.parentPostId),
        gte(feedPosts.createdAt, window.start),
        lt(feedPosts.createdAt, window.end),
      ),
    )
    .orderBy(desc(feedPosts.createdAt))
    .limit(1);

  await insertHousePost({
    paw: input.paw,
    body: houseResultBody({
      handle: input.handle,
      kind: input.kind,
      stackWobble: input.stackWobble,
      correctCount: input.correctCount,
    }),
    slot: "result",
    lineId: null,
    playKind: input.kind,
    parentPostId: dare?.id ?? null,
  });
}

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedIdentities } from "@/db/schema";
import { numberedFeedHandle, randomFeedHandle } from "@/lib/feed-handles";
import { ensureDeviceCookie } from "@/lib/scan-session";
import { ensureFeedTables } from "@/lib/feed-schema";

export type FeedIdentity = {
  id: string;
  deviceKey: string;
  publicHandle: string;
  trustLevel: string;
  postingStatus: string;
  createdAt: Date;
};

function mapIdentity(row: typeof feedIdentities.$inferSelect): FeedIdentity {
  return {
    id: row.id,
    deviceKey: row.deviceKey,
    publicHandle: row.publicHandle,
    trustLevel: row.trustLevel,
    postingStatus: row.postingStatus,
    createdAt: row.createdAt,
  };
}

export async function getOrCreateFeedIdentity(): Promise<FeedIdentity> {
  await ensureFeedTables();
  const deviceKey = await ensureDeviceCookie();
  const [existing] = await db()
    .select()
    .from(feedIdentities)
    .where(eq(feedIdentities.deviceKey, deviceKey))
    .limit(1);
  if (existing) return mapIdentity(existing);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const handle =
      attempt === 0
        ? randomFeedHandle()
        : numberedFeedHandle(randomFeedHandle(), attempt + 1);
    try {
      const [row] = await db()
        .insert(feedIdentities)
        .values({
          id: randomUUID(),
          deviceKey,
          publicHandle: handle,
          trustLevel: "new",
          postingStatus: "ok",
        })
        .returning();
      if (row) return mapIdentity(row);
    } catch {
      const [race] = await db()
        .select()
        .from(feedIdentities)
        .where(eq(feedIdentities.deviceKey, deviceKey))
        .limit(1);
      if (race) return mapIdentity(race);
    }
  }

  const [fallback] = await db()
    .insert(feedIdentities)
    .values({
      id: randomUUID(),
      deviceKey,
      publicHandle: `Guest ${deviceKey.slice(0, 4)}`,
      trustLevel: "new",
      postingStatus: "ok",
    })
    .onConflictDoNothing()
    .returning();
  if (fallback) return mapIdentity(fallback);

  const [again] = await db()
    .select()
    .from(feedIdentities)
    .where(eq(feedIdentities.deviceKey, deviceKey))
    .limit(1);
  if (!again) throw new Error("Could not mint a room identity");
  return mapIdentity(again);
}

export function identityIsNew(identity: FeedIdentity, at = new Date()) {
  if (identity.trustLevel === "restricted") return true;
  if (identity.trustLevel !== "new") return false;
  const born = new Date(identity.createdAt).getTime();
  return at.getTime() - born < 24 * 60 * 60 * 1000;
}

export async function maybePromoteIdentity(identity: FeedIdentity) {
  if (identity.trustLevel !== "new") return;
  if (identityIsNew(identity)) return;
  await db()
    .update(feedIdentities)
    .set({ trustLevel: "normal", updatedAt: new Date() })
    .where(eq(feedIdentities.id, identity.id));
}

export async function setPostingStatus(
  identityId: string,
  postingStatus: string,
) {
  await db()
    .update(feedIdentities)
    .set({ postingStatus, updatedAt: new Date() })
    .where(eq(feedIdentities.id, identityId));
}

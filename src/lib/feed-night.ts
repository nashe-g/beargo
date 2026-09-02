import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { feedPosts } from "@/db/schema";
import { serviceDayWindow } from "@/lib/dates";
import { listNearbyRoomPosts } from "@/lib/feed-nearby";
import { peopleHereTonight } from "@/lib/feed-presence";
import { pulseFrom, type NightPulse } from "@/lib/feed-pulse";
import { ensureFeedTables } from "@/lib/feed-schema";
import type { NightView } from "@/lib/feed-types";
import type { PawRecord } from "@/lib/paws";

export async function postsTonightAt(paw: PawRecord) {
  await ensureFeedTables();
  const window = serviceDayWindow(paw.timezone);
  const rows = await db()
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(
      and(
        eq(feedPosts.hostId, paw.hostId),
        eq(feedPosts.status, "published"),
        isNull(feedPosts.parentPostId),
        gte(feedPosts.createdAt, window.start),
        lt(feedPosts.createdAt, window.end),
      ),
    );
  return rows.length;
}

export async function nightPulseFor(paw: PawRecord): Promise<NightPulse> {
  const [peopleHere, postsTonight] = await Promise.all([
    peopleHereTonight(paw),
    postsTonightAt(paw),
  ]);
  return pulseFrom(peopleHere, postsTonight);
}

export async function nightViewFor(paw: PawRecord): Promise<NightView> {
  const [pulse, nearby] = await Promise.all([
    nightPulseFor(paw),
    listNearbyRoomPosts(paw),
  ]);
  return { ...pulse, nearbyCount: nearby.length };
}

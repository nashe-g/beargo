import { and, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { feedPosts, paws } from "@/db/schema";
import { FEED_ROOM_ENABLED } from "@/lib/config";
import { serviceDayWindow } from "@/lib/dates";
import { nearbyHostsFor } from "@/lib/feed-nearby";
import { peopleHereByHosts, peopleHereTonight } from "@/lib/feed-presence";
import { pulseFrom, type NightPulse } from "@/lib/feed-pulse";
import { ensureFeedTables } from "@/lib/feed-schema";
import { isoRequired } from "@/lib/money";
import type { NearbyVenueView, NightView, OverheardPost } from "@/lib/feed-types";
import type { PawRecord } from "@/lib/paws";
import { nightCrownFor } from "@/lib/store";

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

export async function overheardTonight(
  paw: PawRecord,
  limit = 8,
): Promise<OverheardPost[]> {
  if (!FEED_ROOM_ENABLED) return [];
  await ensureFeedTables();
  const window = serviceDayWindow(paw.timezone);
  const rows = await db()
    .select({
      id: feedPosts.id,
      handle: feedPosts.handleSnapshot,
      body: feedPosts.body,
      createdAt: feedPosts.createdAt,
      upvotes: feedPosts.upvoteCount,
    })
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
  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    body: row.body,
    createdAt: isoRequired(row.createdAt),
    upvotes: row.upvotes ?? 0,
  }));
}

export async function nightPulseFor(paw: PawRecord): Promise<NightPulse> {
  const [peopleHere, postsTonight] = await Promise.all([
    peopleHereTonight(paw),
    postsTonightAt(paw),
  ]);
  return pulseFrom(peopleHere, postsTonight);
}

async function postsTonightByHosts(hosts: { id: string; timezone: string }[]) {
  const counts = new Map<string, number>();
  if (hosts.length === 0) return counts;
  await ensureFeedTables();
  const byZone = new Map<string, string[]>();
  for (const host of hosts) {
    const list = byZone.get(host.timezone) ?? [];
    list.push(host.id);
    byZone.set(host.timezone, list);
  }
  await Promise.all(
    [...byZone].map(async ([timezone, hostIds]) => {
      const window = serviceDayWindow(timezone);
      const rows = await db()
        .select({ hostId: feedPosts.hostId })
        .from(feedPosts)
        .where(
          and(
            inArray(feedPosts.hostId, hostIds),
            eq(feedPosts.status, "published"),
            isNull(feedPosts.parentPostId),
            gte(feedPosts.createdAt, window.start),
            lt(feedPosts.createdAt, window.end),
          ),
        );
      for (const row of rows) {
        counts.set(row.hostId, (counts.get(row.hostId) ?? 0) + 1);
      }
    }),
  );
  return counts;
}

export async function nearbyVenuesFor(
  paw: PawRecord,
  limit = 5,
): Promise<NearbyVenueView[]> {
  if (!FEED_ROOM_ENABLED) return [];
  const near = await nearbyHostsFor(paw);
  if (near.length === 0) return [];
  const hostIds = near.map((row) => row.host.id);
  const [people, posts, pawRows] = await Promise.all([
    peopleHereByHosts(hostIds),
    postsTonightByHosts(near.map((row) => ({ id: row.host.id, timezone: row.host.timezone }))),
    db()
      .select({ token: paws.token, hostId: paws.hostId })
      .from(paws)
      .where(inArray(paws.hostId, hostIds)),
  ]);
  const pawByHost = new Map<string, string>();
  for (const row of pawRows) {
    if (!pawByHost.has(row.hostId)) pawByHost.set(row.hostId, row.token);
  }
  return near
    .map((row) => {
      const pulse = pulseFrom(
        people.get(row.host.id) ?? 0,
        posts.get(row.host.id) ?? 0,
      );
      return {
        hostId: row.host.id,
        venue: row.host.displayName,
        pawToken: pawByHost.get(row.host.id) ?? null,
        miles: row.miles,
        label: pulse.label,
        score: pulse.score,
      };
    })
    .filter((row) => row.pawToken && row.score >= 1)
    .sort((a, b) => b.score - a.score || a.miles - b.miles)
    .slice(0, limit);
}

export async function nightViewFor(paw: PawRecord): Promise<NightView> {
  const [pulse, nearbyVenues, overheard, trayCrown, triviaCrown] =
    await Promise.all([
      nightPulseFor(paw),
      nearbyVenuesFor(paw),
      overheardTonight(paw),
      nightCrownFor(paw, "stack"),
      nightCrownFor(paw, "trivia"),
    ]);
  return {
    ...pulse,
    nearbyCount: nearbyVenues.length,
    nearbyVenues,
    overheard,
    trayCrown,
    triviaCrown,
  };
}

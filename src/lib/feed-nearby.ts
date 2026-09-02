import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { feedPosts, paws } from "@/db/schema";
import { FEED_NEARBY_LIMIT, FEED_NEARBY_MILES } from "@/lib/config";
import { listHosts } from "@/lib/catalog";
import { getHost } from "@/lib/hosts";
import { milesBetween } from "@/lib/geo";
import { isoRequired } from "@/lib/money";
import type { PawRecord } from "@/lib/paws";
import { ensureFeedTables } from "@/lib/feed-schema";
import type { NearbyPostView } from "@/lib/feed-types";

export async function listNearbyRoomPosts(
  paw: PawRecord,
  limit = FEED_NEARBY_LIMIT,
): Promise<NearbyPostView[]> {
  await ensureFeedTables();
  const host = await getHost(paw.hostId);
  if (host?.lat == null || host?.lng == null) return [];

  const origin = { lat: host.lat, lng: host.lng };
  const near = (await listHosts())
    .filter(
      (row) =>
        row.id !== host.id &&
        row.status === "active" &&
        row.lat != null &&
        row.lng != null,
    )
    .map((row) => ({
      host: row,
      miles: milesBetween(origin, { lat: row.lat!, lng: row.lng! }),
    }))
    .filter((row) => row.miles <= FEED_NEARBY_MILES)
    .sort((a, b) => a.miles - b.miles);

  if (near.length === 0) return [];

  const milesByHost = new Map(near.map((row) => [row.host.id, row.miles]));
  const nameByHost = new Map(near.map((row) => [row.host.id, row.host.displayName]));
  const hostIds = near.map((row) => row.host.id);

  const [postRows, pawRows] = await Promise.all([
    db()
      .select()
      .from(feedPosts)
      .where(
        and(
          inArray(feedPosts.hostId, hostIds),
          eq(feedPosts.status, "published"),
          isNull(feedPosts.parentPostId),
        ),
      )
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit * 3),
    db().select({ token: paws.token, hostId: paws.hostId }).from(paws).where(
      inArray(paws.hostId, hostIds),
    ),
  ]);

  const pawByHost = new Map<string, string>();
  for (const row of pawRows) {
    if (!pawByHost.has(row.hostId)) pawByHost.set(row.hostId, row.token);
  }

  const out: NearbyPostView[] = [];
  for (const row of postRows) {
    out.push({
      id: row.id,
      venue: nameByHost.get(row.hostId) ?? row.hostId,
      hostId: row.hostId,
      pawToken: pawByHost.get(row.hostId) ?? null,
      body: row.body,
      handle: row.handleSnapshot,
      createdAt: isoRequired(row.createdAt),
      miles: milesByHost.get(row.hostId) ?? 0,
    });
    if (out.length >= limit) break;
  }
  return out;
}

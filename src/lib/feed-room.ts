import {
  getFeedIdentityIfPresent,
  type FeedIdentity,
} from "@/lib/feed-identity";
import { listNearbyRoomPosts } from "@/lib/feed-nearby";
import { nightPulseFor } from "@/lib/feed-night";
import { canPostToRoom, roomPlaySource } from "@/lib/feed-presence";
import { listRoomPosts } from "@/lib/feed-store";
import type { RoomSnapshot } from "@/lib/feed-types";
import { ensureHouseNightIfPresent } from "@/lib/house-night";
import type { PawRecord } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { rankedPlayForDevice } from "@/lib/store";

export type { RoomSnapshot };

export async function roomSnapshot(
  paw: PawRecord,
  identity?: FeedIdentity | null,
): Promise<RoomSnapshot> {
  const resolved =
    identity === undefined ? await getFeedIdentityIfPresent() : identity;
  await ensureHouseNightIfPresent(paw);
  const deviceKey = resolved?.deviceKey ?? (await deviceKeyFromCookies());
  const [canPost, pulse, posts, nearby, source, stack, trivia] =
    await Promise.all([
      canPostToRoom(paw),
      nightPulseFor(paw),
      listRoomPosts(paw, resolved?.id ?? null),
      listNearbyRoomPosts(paw),
      roomPlaySource(paw),
      deviceKey ? rankedPlayForDevice(paw, deviceKey, "stack") : null,
      deviceKey ? rankedPlayForDevice(paw, deviceKey, "trivia") : null,
    ]);
  return {
    handle: resolved?.publicHandle ?? "",
    canPost,
    peopleHere: pulse.peopleHere,
    pulse,
    posts,
    nearby,
    sponsor: null,
    source,
    played: { stack: Boolean(stack), trivia: Boolean(trivia) },
  };
}

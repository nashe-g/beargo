import {
  getFeedIdentityIfPresent,
  type FeedIdentity,
} from "@/lib/feed-identity";
import { listNearbyRoomPosts } from "@/lib/feed-nearby";
import { nightPulseFor } from "@/lib/feed-night";
import { canPostToRoom, roomPlaySource } from "@/lib/feed-presence";
import { listRoomPosts } from "@/lib/feed-store";
import type { RoomSnapshot } from "@/lib/feed-types";
import { tableForDeviceTonight } from "@/lib/night-tables";
import type { PawRecord } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";

export type { RoomSnapshot };

export async function roomSnapshot(
  paw: PawRecord,
  identity?: FeedIdentity | null,
): Promise<RoomSnapshot> {
  const resolved =
    identity === undefined ? await getFeedIdentityIfPresent() : identity;
  const deviceKey = resolved?.deviceKey ?? (await deviceKeyFromCookies());
  const table = deviceKey
    ? await tableForDeviceTonight(paw, deviceKey)
    : null;
  const [canPost, pulse, posts, nearby, source] = await Promise.all([
    canPostToRoom(paw),
    nightPulseFor(paw),
    listRoomPosts(paw, resolved?.id ?? null),
    listNearbyRoomPosts(paw),
    roomPlaySource(paw),
  ]);
  return {
    handle: table?.name || resolved?.publicHandle || "",
    canPost,
    peopleHere: pulse.peopleHere,
    pulse,
    posts,
    nearby,
    source,
  };
}

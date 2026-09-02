import { selectAffiliateCard, type AffiliateCardView } from "@/lib/affiliate";
import {
  getFeedIdentityIfPresent,
  type FeedIdentity,
} from "@/lib/feed-identity";
import {
  canPostToRoom,
  peopleHereTonight,
  roomPlaySource,
} from "@/lib/feed-presence";
import { listRoomPosts } from "@/lib/feed-store";
import type { FeedPostView } from "@/lib/feed-types";
import type { PawRecord } from "@/lib/paws";
import type { PlaySource } from "@/lib/play-source";

export type RoomSnapshot = {
  handle: string;
  canPost: boolean;
  peopleHere: number;
  posts: FeedPostView[];
  sponsor: AffiliateCardView | null;
  source: PlaySource;
};

export async function roomSnapshot(
  paw: PawRecord,
  identity?: FeedIdentity | null,
): Promise<RoomSnapshot> {
  const resolved =
    identity === undefined ? await getFeedIdentityIfPresent() : identity;
  const [canPost, peopleHere, posts, source] = await Promise.all([
    canPostToRoom(paw),
    peopleHereTonight(paw),
    listRoomPosts(paw, resolved?.id ?? null),
    roomPlaySource(paw),
  ]);
  let sponsor: AffiliateCardView | null = null;
  try {
    sponsor = await selectAffiliateCard({ hostId: paw.hostId });
  } catch {
    sponsor = null;
  }
  return {
    handle: resolved?.publicHandle ?? "",
    canPost,
    peopleHere,
    posts,
    sponsor,
    source,
  };
}

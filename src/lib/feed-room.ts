import { selectAffiliateCard, type AffiliateCardView } from "@/lib/affiliate";
import { getOrCreateFeedIdentity } from "@/lib/feed-identity";
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

export async function roomSnapshot(paw: PawRecord): Promise<RoomSnapshot> {
  const identity = await getOrCreateFeedIdentity();
  const [canPost, peopleHere, posts, source] = await Promise.all([
    canPostToRoom(paw),
    peopleHereTonight(paw),
    listRoomPosts(paw, identity.id),
    roomPlaySource(paw),
  ]);
  let sponsor: AffiliateCardView | null = null;
  try {
    sponsor = await selectAffiliateCard({ hostId: paw.hostId });
  } catch {
    sponsor = null;
  }
  return {
    handle: identity.publicHandle,
    canPost,
    peopleHere,
    posts,
    sponsor,
    source,
  };
}

export const FEED_REPORT_REASONS = [
  "harassment",
  "threat",
  "hate",
  "private_information",
  "spam",
  "sexual_harassment",
  "other",
] as const;

export type FeedReportReason = (typeof FEED_REPORT_REASONS)[number];

export type FeedPostView = {
  id: string;
  body: string;
  handle: string;
  createdAt: string;
  replyCount: number;
  parentId: string | null;
  mine: boolean;
  replies: FeedPostView[];
};

export type RoomSponsorCard = {
  offerId: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  body: string;
  ctaLabel: string;
  imageUrl: string | null;
  hostId: string;
};

export type RoomSnapshot = {
  handle: string;
  canPost: boolean;
  peopleHere: number;
  posts: FeedPostView[];
  sponsor: RoomSponsorCard | null;
  source: string;
};

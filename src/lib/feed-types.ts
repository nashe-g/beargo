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
  upvoteCount: number;
  downvoteCount: number;
  myVote: "up" | "down" | null;
  replies: FeedPostView[];
  authorKind: "human" | "house";
};

export type NearbyPostView = {
  id: string;
  venue: string;
  hostId: string;
  pawToken: string | null;
  body: string;
  handle: string;
  createdAt: string;
  miles: number;
};

export type NightPulseView = {
  score: number;
  label: string;
  peopleHere: number;
  postsTonight: number;
};

export type RoomSnapshot = {
  handle: string;
  canPost: boolean;
  peopleHere: number;
  pulse: NightPulseView;
  posts: FeedPostView[];
  nearby: NearbyPostView[];
  source: string;
};

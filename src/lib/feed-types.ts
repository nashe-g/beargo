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
};

export type NearbyVenueView = {
  hostId: string;
  venue: string;
  pawToken: string | null;
  miles: number;
  label: string;
  score: number;
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

export type OverheardPost = {
  id: string;
  handle: string;
  body: string;
  createdAt: string;
  upvotes: number;
};

export type NightCrown = {
  handle: string;
  wobble: number | null;
  correctCount: number;
};

export type NightView = NightPulseView & {
  nearbyCount: number;
  nearbyVenues: NearbyVenueView[];
  overheard: OverheardPost[];
  trayCrown: NightCrown | null;
  triviaCrown: NightCrown | null;
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
  pulse: NightPulseView;
  posts: FeedPostView[];
  nearby: NearbyPostView[];
  sponsor: RoomSponsorCard | null;
  source: string;
};

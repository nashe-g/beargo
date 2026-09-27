export const APP_NAME = "BearGo";
export const CANONICAL_HOST = "beargo.pro";
export const CANONICAL_ORIGIN = "https://beargo.pro";
export const BEARGO_DAY_ZONE = "America/Chicago";

/** Legacy local coupon/voucher after gameplay. Keep the tables; do not show to players. */
export const PLAYER_OFFERS_ENABLED = false;
export const LEGACY_LOCAL_COUPON_PUBLIC_ENABLED = PLAYER_OFFERS_ENABLED;

/** Off until there are real deals. Room and post-game both read this. */
export const AFFILIATE_POSTGAME_ENABLED = false;

/**
 * Public night: Scan sits a table, plays the games, and may join a live chat.
 */
export const FEED_ROOM_ENABLED = true;
/**
 * Run omni-moderation on every post and store what full policy would do.
 * Enforce PII + high-confidence threats (+ sexual/minors) even while this is on.
 */
export const FEED_MODERATION_SHADOW = true;
export const FEED_POST_MAX = 400;
export const TABLE_NAME_MAX = 28;
export const TABLE_NICK_MAX = 14;
export const TABLE_CODE_LENGTH = 4;
export const FEED_POSTS_PER_HOUR = 5;
export const FEED_POSTS_PER_HOUR_NEW = 3;
export const FEED_REPLIES_PER_HOUR = 20;
export const FEED_BURST_LIMIT = 3;
export const FEED_BURST_WINDOW_MS = 2 * 60 * 1000;
export const FEED_REPORT_HIDE_COUNT = 3;
export const FEED_REPORT_HIDE_WINDOW_MS = 20 * 60 * 1000;
export const FEED_NEARBY_MILES = 3;
export const FEED_NEARBY_LIMIT = 12;
/** Distinct in-bar devices in this window count as “here”. */
export const FEED_HERE_WINDOW_MS = 4 * 60 * 60 * 1000;

/** How many nights the admin calendar shows. Generate fills the next two empty days. */
export const SLATE_HORIZON_DAYS = 7;
export const SLATE_GENERATE_DAYS = 2;

export function pawScanUrl(token: string, origin: string = CANONICAL_ORIGIN) {
  return `${origin.replace(/\/$/, "")}/p/${encodeURIComponent(token)}`;
}

export function publicOrigin(request: Request) {
  const configured = process.env.MAIL_LINK_ORIGIN?.replace(/\/$/, "");
  if (configured) return configured;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;

  return new URL(request.url).origin;
}

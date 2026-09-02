export const APP_NAME = "BearGo";
export const CANONICAL_HOST = "beargo.pro";
export const CANONICAL_ORIGIN = "https://beargo.pro";
export const BEARGO_DAY_ZONE = "America/Chicago";

/** Legacy local coupon/voucher after gameplay. Keep the tables; do not show to players. */
export const PLAYER_OFFERS_ENABLED = false;
export const LEGACY_LOCAL_COUPON_PUBLIC_ENABLED = PLAYER_OFFERS_ENABLED;

/** Post-game CJ affiliate card. Kill switch; still serves nothing without an eligible offer. */
export const AFFILIATE_POSTGAME_ENABLED = true;

/**
 * Public night: Scan hub → room, wobble, or trivia, each with its own
 * rank and sponsor. Pour stays archived.
 */
export const TRIVIA_ENABLED = true;
export const POUR_ENABLED = false;

/** Venue room behind a paw scan. */
export const FEED_ROOM_ENABLED = true;
/**
 * Run omni-moderation on every post and store what full policy would do.
 * Enforce PII + high-confidence threats (+ sexual/minors) even while this is on.
 */
export const FEED_MODERATION_SHADOW = true;
export const FEED_POST_MAX = 400;
export const FEED_POSTS_PER_HOUR = 5;
export const FEED_POSTS_PER_HOUR_NEW = 3;
export const FEED_REPLIES_PER_HOUR = 20;
export const FEED_BURST_LIMIT = 3;
export const FEED_BURST_WINDOW_MS = 2 * 60 * 1000;
export const FEED_REPORT_HIDE_COUNT = 3;
export const FEED_REPORT_HIDE_WINDOW_MS = 20 * 60 * 1000;
export const AFFILIATE_ROOM_PLACEMENT = "room_thread";

/** The wobble game. This is BearGo now. */
export const STACK_ENABLED = true;

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

export const APP_NAME = "BearGo";
export const CANONICAL_HOST = "beargo.pro";
export const CANONICAL_ORIGIN = "https://beargo.pro";
export const BEARGO_DAY_ZONE = "America/Chicago";

/** Legacy local coupon/voucher after gameplay. Keep the tables; do not show to players. */
export const PLAYER_OFFERS_ENABLED = false;
export const LEGACY_LOCAL_COUPON_PUBLIC_ENABLED = PLAYER_OFFERS_ENABLED;

/** Post-game CJ affiliate card. Kill switch; still serves nothing without an eligible offer. */
export const AFFILIATE_POSTGAME_ENABLED = true;

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

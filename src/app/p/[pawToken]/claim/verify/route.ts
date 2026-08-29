import { NextResponse } from "next/server";
import { PLAYER_OFFERS_ENABLED } from "@/lib/config";
import { offerAcceptsNewClaims } from "@/lib/offer";
import { getPromotion } from "@/lib/promotions";
import {
  PLAYER_COOKIE,
  consumeClaimLink,
  markClaimLinkUsed,
  markPlayerVerified,
} from "@/lib/players";
import { ensureScanSession, stampSession } from "@/lib/scan-session";
import {
  httpCookieOptions,
  type CookieWriter,
} from "@/lib/http-cookies";
import { getPaw } from "@/lib/paws";
import { claimVoucher } from "@/lib/vouchers";

function requestCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export async function GET(
  request: Request,
  context: RouteContext<"/p/[pawToken]/claim/verify">,
) {
  const { pawToken } = await context.params;
  const url = new URL(request.url);
  if (!PLAYER_OFFERS_ENABLED) {
    return NextResponse.redirect(new URL(`/p/${pawToken}/result`, url.origin));
  }
  const token = url.searchParams.get("t");
  if (!token) {
    return NextResponse.redirect(new URL(`/p/${pawToken}/offer`, url.origin));
  }

  const claim = await consumeClaimLink(token);
  if (!claim || claim.pawToken !== pawToken) {
    return NextResponse.redirect(new URL(`/p/${pawToken}/offer`, url.origin));
  }

  const paw = await getPaw(pawToken);
  const promotion = await getPromotion(claim.promotionId);
  if (!promotion || !offerAcceptsNewClaims(promotion)) {
    return NextResponse.redirect(new URL(`/p/${pawToken}/result`, url.origin));
  }

  await markPlayerVerified(claim.playerId);

  const pending = new Map<
    string,
    { value: string; options: ReturnType<typeof httpCookieOptions> }
  >();
  const writer: CookieWriter = {
    get: (name) => pending.get(name)?.value ?? requestCookie(request, name),
    set: (name, value, options) => {
      pending.set(name, { value, options });
    },
  };
  writer.set(
    PLAYER_COOKIE,
    claim.playerId,
    httpCookieOptions(60 * 60 * 24 * 400),
  );

  const session = await ensureScanSession(
    paw,
    { promotionId: claim.promotionId },
    writer,
  );
  const voucher = await claimVoucher({
    promotion,
    hostId: claim.hostId,
    pawToken,
    sessionId: claim.sessionId ?? session.id,
    deviceKey: claim.deviceKey,
    playerId: claim.playerId,
  });
  await markClaimLinkUsed(claim.tokenHash);
  await stampSession(session.id, "claimed", {
    promotionId: claim.promotionId,
    voucherId: voucher.id,
  });

  const response = NextResponse.redirect(
    new URL(`/p/${pawToken}/voucher/${voucher.token}`, url.origin),
  );
  for (const [name, cookie] of pending) {
    response.cookies.set(name, cookie.value, cookie.options);
  }
  return response;
}

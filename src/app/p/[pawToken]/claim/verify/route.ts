import { redirect } from "next/navigation";
import { getPromotion } from "@/lib/promotions";
import {
  consumeClaimLink,
  markClaimLinkUsed,
  markPlayerVerified,
  setPlayerCookie,
} from "@/lib/players";
import { ensureScanSession, stampSession } from "@/lib/scan-session";
import { getPaw } from "@/lib/paws";
import { claimVoucher } from "@/lib/vouchers";

export async function GET(
  request: Request,
  context: RouteContext<"/p/[pawToken]/claim/verify">,
) {
  const { pawToken } = await context.params;
  const token = new URL(request.url).searchParams.get("t");
  if (!token) redirect(`/p/${pawToken}/offer`);

  const claim = await consumeClaimLink(token);
  if (!claim || claim.pawToken !== pawToken) {
    redirect(`/p/${pawToken}/offer`);
  }

  const paw = await getPaw(pawToken);
  const promotion = await getPromotion(claim.promotionId);
  if (!promotion || promotion.status !== "live") {
    redirect(`/p/${pawToken}/result`);
  }

  await setPlayerCookie(claim.playerId);
  await markPlayerVerified(claim.playerId);
  const session = await ensureScanSession(paw, {
    promotionId: claim.promotionId,
  });
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
  redirect(`/p/${pawToken}/voucher/${voucher.token}`);
}

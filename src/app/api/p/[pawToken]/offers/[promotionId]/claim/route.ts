import { getHost } from "@/lib/hosts";
import { getPaw } from "@/lib/paws";
import { claimMailOrigin, sendClaimVerification } from "@/lib/claim-mail";
import {
  createClaimLink,
  isValidClaimContact,
  setPlayerCookie,
  upsertPlayer,
} from "@/lib/players";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  deviceKeyFromCookies,
  ensureScanSession,
  sessionIdFromCookies,
  stampSession,
} from "@/lib/scan-session";
import { selectPromotionForHost } from "@/lib/select-promotion";
import { claimedVoucherForDevice, claimVoucher } from "@/lib/vouchers";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string; promotionId: string }> },
) {
  const { pawToken, promotionId } = await context.params;
  if (!rateLimit(clientKey(request, "claim"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }

  const paw = await getPaw(pawToken);
  const host = await getHost(paw.hostId);
  if (!host) {
    return Response.json({ error: "Unknown host" }, { status: 404 });
  }

  let body: { fullName?: string; email?: string; phone?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const contact = isValidClaimContact(body);
  if (!contact.ok) {
    return Response.json({ error: contact.error }, { status: 400 });
  }

  const deviceKey = await deviceKeyFromCookies();
  const selected = await selectPromotionForHost(host, { deviceKey });
  const already =
    deviceKey ? await claimedVoucherForDevice(promotionId, deviceKey) : null;
  if (selected?.promotion.id !== promotionId && !already) {
    return Response.json({ error: "Offer is not available." }, { status: 409 });
  }

  const player = await upsertPlayer(contact);
  await setPlayerCookie(player.id);

  try {
    const session = await ensureScanSession(paw, { promotionId });
    if (already) {
      const sessionId = (await sessionIdFromCookies()) ?? session.id;
      await stampSession(sessionId, "claimed", {
        promotionId,
        voucherId: already.id,
      });
      return Response.json({
        ok: true,
        token: already.token,
        code: already.code,
      });
    }

    if (player.emailVerifiedAt) {
      const voucher = await claimVoucher({
        promotion: selected!.promotion,
        hostId: paw.hostId,
        pawToken,
        sessionId: session.id,
        deviceKey,
        playerId: player.id,
      });
      const sessionId = (await sessionIdFromCookies()) ?? session.id;
      await stampSession(sessionId, "claimed", {
        promotionId,
        voucherId: voucher.id,
      });
      return Response.json({
        ok: true,
        token: voucher.token,
        code: voucher.code,
      });
    }

    const token = await createClaimLink({
      playerId: player.id,
      promotionId,
      hostId: paw.hostId,
      pawToken,
      sessionId: session.id,
      deviceKey,
    });
    const mailed = await sendClaimVerification({
      player,
      token,
      pawToken,
      origin: claimMailOrigin(request),
    });
    return Response.json({
      ok: true,
      verify: true,
      sent: mailed.ok,
      mode: mailed.mode,
      email: player.email,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not claim this offer.",
      },
      { status: 409 },
    );
  }
}

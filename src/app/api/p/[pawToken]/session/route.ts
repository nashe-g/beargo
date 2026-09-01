import { cookies } from "next/headers";
import { getPaw } from "@/lib/paws";
import { getHost } from "@/lib/hosts";
import { selectPromotionForHost } from "@/lib/select-promotion";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  attachSessionPromotion,
  ensureScanSession,
  stampSession,
  type SessionStamp,
} from "@/lib/scan-session";
import { inferPlaySource } from "@/lib/play-source";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  const { pawToken } = await context.params;
  if (!rateLimit(clientKey(request, "session"), 60, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }

  const paw = await getPaw(pawToken);
  let body: {
    event?: string;
    promotionId?: string;
    voucherId?: string;
    from?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const host = await getHost(paw.hostId);
  const selected = host
    ? await selectPromotionForHost(host)
    : null;
  const promotionId =
    body.promotionId ?? selected?.promotion.id ?? null;
  const entrySource = inferPlaySource(paw.token, body.from ?? null);
  const session = await ensureScanSession(paw, { promotionId, entrySource });
  if (promotionId) await attachSessionPromotion(session.id, promotionId);
  const event = (body.event ?? "scanned") as SessionStamp;
  await stampSession(session.id, event, {
    promotionId: promotionId ?? undefined,
    voucherId: body.voucherId,
  });

  const jar = await cookies();
  void jar.get(DEVICE_COOKIE);
  void jar.get(SCAN_COOKIE);

  return Response.json({ ok: true, sessionId: session.id });
}

import { cookies } from "next/headers";
import { getPaw } from "@/lib/paws";
import { getHost } from "@/lib/hosts";
import { selectPromotionForHost } from "@/lib/select-promotion";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  attachSessionPromotion,
  ensureScanSession,
  isLikelyBot,
  parseDeviceHint,
  stampSession,
  type SessionStamp,
} from "@/lib/scan-session";
import { ENTRY_COOKIE, inferPlaySource, parsePlaySource } from "@/lib/play-source";
import { getOrCreateFeedIdentityForDevice } from "@/lib/feed-identity";
import { canPostWithSource } from "@/lib/feed-presence";
import { ensureHouseNight } from "@/lib/house-night";
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
  if (isLikelyBot(request.headers.get("user-agent"))) {
    return Response.json({ ok: true, skipped: true });
  }

  let body: {
    event?: string;
    promotionId?: string;
    voucherId?: string;
    from?: string | null;
    deviceHint?: string;
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
  const jar = await cookies();
  const entrySource =
    body.from === undefined
      ? parsePlaySource(jar.get(ENTRY_COOKIE)?.value) ??
        inferPlaySource(paw.token, null)
      : inferPlaySource(paw.token, body.from);
  const session = await ensureScanSession(paw, {
    promotionId,
    entrySource,
    deviceHint: parseDeviceHint(body.deviceHint),
  });
  if (promotionId) await attachSessionPromotion(session.id, promotionId);
  const event = (body.event ?? "scanned") as SessionStamp;
  await stampSession(session.id, event, {
    promotionId: promotionId ?? undefined,
    voucherId: body.voucherId,
  });

  void jar.get(DEVICE_COOKIE);
  void jar.get(SCAN_COOKIE);

  let handle: string | null = null;
  try {
    if (session.deviceKey) {
      const identity = await getOrCreateFeedIdentityForDevice(session.deviceKey);
      handle = identity.publicHandle;
    }
  } catch {
    handle = null;
  }

  if (canPostWithSource(paw, entrySource)) {
    try {
      await ensureHouseNight(paw);
    } catch {
      /* first scan still works if the House is late */
    }
  }

  return Response.json({ ok: true, sessionId: session.id, handle });
}

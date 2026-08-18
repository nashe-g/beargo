import { cookies } from "next/headers";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  ensureScanSession,
  stampSession,
  type SessionStamp,
} from "@/lib/scan-session";
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
  let body: { event?: string; interestId?: string; campaignId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const campaign = await todaysSponsor(paw);
  const session = await ensureScanSession(paw, {
    campaignId: campaign?.id ?? body.campaignId ?? null,
  });
  const event = (body.event ?? "scanned") as SessionStamp;
  await stampSession(session.id, event, {
    interestId: body.interestId,
    leadId: undefined,
    campaignId: campaign?.id ?? body.campaignId,
  });

  const jar = await cookies();
  if (!jar.get(DEVICE_COOKIE)?.value) {
    /* ensureScanSession already set cookies when missing */
  }
  if (!jar.get(SCAN_COOKIE)?.value) {
    /* same */
  }

  return Response.json({ ok: true, sessionId: session.id });
}

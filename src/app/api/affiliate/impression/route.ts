import { NextResponse } from "next/server";
import { getEligibleOfferById, recordAffiliateEvent } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    offerId?: string;
    advertiserId?: string;
    hostId?: string;
    placement?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const offerId = String(body.offerId ?? "");
  const hostId = String(body.hostId ?? "");
  if (!offerId) return NextResponse.json({ ok: false }, { status: 400 });

  const live = await getEligibleOfferById({ offerId });
  if (!live) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    await recordAffiliateEvent({
      kind: "impression",
      offerId: live.offer.id,
      advertiserId: live.advertiser.id,
      hostId: hostId || null,
      placement: typeof body.placement === "string" ? body.placement : undefined,
    });
  } catch {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}

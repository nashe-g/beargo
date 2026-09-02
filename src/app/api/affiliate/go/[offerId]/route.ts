import { NextResponse } from "next/server";
import { recordAffiliateEvent, resolveAffiliateClick } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await context.params;
  const url = new URL(request.url);
  const hostId = url.searchParams.get("host");
  const resolved = await resolveAffiliateClick({
    offerId,
    hostId,
  });
  if (!resolved) {
    return NextResponse.redirect(new URL("/", url.origin));
  }
  try {
    await recordAffiliateEvent({
      kind: "click",
      offerId: resolved.offer.id,
      advertiserId: resolved.advertiser.id,
      hostId,
      placement: url.searchParams.get("placement") ?? undefined,
    });
  } catch {
    // Navigation must not wait on analytics.
  }
  return NextResponse.redirect(resolved.url, 302);
}

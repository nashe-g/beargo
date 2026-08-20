import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { createLiveOffer, type OfferDraft } from "@/lib/create-offer";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";
import { getMerchant } from "@/lib/promotions";

export async function POST(request: Request) {
  const merchantId = (await cookies()).get(MERCHANT_COOKIE)?.value;
  const merchant = merchantId ? await getMerchant(merchantId) : null;
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as OfferDraft;
  const created = await createLiveOffer({
    merchant,
    draft: body,
    testMode: false,
  });
  if ("error" in created) {
    return NextResponse.json(
      { error: created.error },
      { status: created.status },
    );
  }
  await audit("merchant", "promotions.create", {
    id: created.promotion.id,
    merchantId: merchant.id,
  });
  return NextResponse.json({ promotion: created.promotion });
}

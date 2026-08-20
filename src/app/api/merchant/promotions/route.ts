import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { publicOrigin } from "@/lib/config";
import { createOffer, type OfferDraft } from "@/lib/create-offer";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";
import { emailAdminOfferSubmitted } from "@/lib/offer-mail";
import {
  ensurePromotionReviewColumn,
  getMerchant,
  listLocations,
} from "@/lib/promotions";

export async function POST(request: Request) {
  const merchantId = (await cookies()).get(MERCHANT_COOKIE)?.value;
  const merchant = merchantId ? await getMerchant(merchantId) : null;
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensurePromotionReviewColumn();
  const locations = await listLocations(merchant.id);
  const location = locations[0];
  if (!location) {
    return NextResponse.json(
      { error: "BearGo still needs to set your business address." },
      { status: 400 },
    );
  }
  const body = (await request.json()) as OfferDraft;
  const created = await createOffer({
    merchant,
    draft: body,
    testMode: false,
    status: "pending",
    lockedLocation: location,
  });
  if ("error" in created) {
    return NextResponse.json(
      { error: created.error },
      { status: created.status },
    );
  }
  await audit("merchant", "promotions.submit", {
    id: created.promotion.id,
    merchantId: merchant.id,
  });
  await emailAdminOfferSubmitted(created.promotion, publicOrigin(request));
  return NextResponse.json({ promotion: created.promotion });
}

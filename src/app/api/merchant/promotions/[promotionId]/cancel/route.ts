import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";
import { audit } from "@/lib/audit";
import { cancelPromotion, getPromotion } from "@/lib/promotions";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/merchant/promotions/[promotionId]/cancel">,
) {
  const merchantId = (await cookies()).get(MERCHANT_COOKIE)?.value;
  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { promotionId } = await context.params;
  const existing = await getPromotion(promotionId);
  if (!existing || existing.merchantId !== merchantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const promotion = await cancelPromotion(promotionId);
  if (!promotion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await audit("merchant", "promotions.cancel", {
    id: promotion.id,
    merchantId,
  });
  return NextResponse.json({ ok: true, status: promotion.status });
}

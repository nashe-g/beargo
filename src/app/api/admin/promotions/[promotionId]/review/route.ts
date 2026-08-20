import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import {
  emailMerchantOfferApproved,
  emailMerchantOfferDeclined,
} from "@/lib/offer-mail";
import {
  emailsForMerchant,
  ensurePromotionReviewColumn,
  reviewPendingPromotion,
} from "@/lib/promotions";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/promotions/[promotionId]/review">,
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensurePromotionReviewColumn();
  const { promotionId } = await context.params;
  const body = (await request.json()) as {
    action?: string;
    reason?: string;
  };
  const action = body.action === "decline" ? "decline" : body.action === "approve" ? "approve" : null;
  if (!action) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const result = await reviewPendingPromotion(promotionId, {
    action,
    reason: body.reason,
  });
  if (!result.ok || !result.promotion) {
    return NextResponse.json(
      { error: result.ok ? "Not found" : result.error },
      { status: result.ok ? 404 : result.status },
    );
  }
  const emails = await emailsForMerchant(result.promotion.merchantId);
  if (result.action === "approve") {
    await emailMerchantOfferApproved(emails, result.promotion);
    await audit("admin", "promotions.approve", { id: result.promotion.id });
  } else {
    await emailMerchantOfferDeclined(
      emails,
      result.promotion,
      result.reason ?? "",
    );
    await audit("admin", "promotions.decline", {
      id: result.promotion.id,
      reason: result.reason,
    });
  }
  return NextResponse.json({ ok: true, status: result.promotion.status });
}

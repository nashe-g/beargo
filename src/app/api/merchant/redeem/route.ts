import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MERCHANT_COOKIE } from "@/lib/auth";
import { centsFromDollars } from "@/lib/money";
import { formatApplyDiscount, offerTitle } from "@/lib/offer";
import { getMerchant } from "@/lib/promotions";
import {
  getVoucherByCode,
  getVoucherByToken,
  previewRedemption,
  redeemVoucher,
} from "@/lib/vouchers";

export async function POST(request: Request) {
  const merchantId = (await cookies()).get(MERCHANT_COOKIE)?.value;
  if (!merchantId || !(await getMerchant(merchantId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: string;
    code?: string;
    token?: string;
    subtotal?: string | number;
  };

  const voucher = body.token
    ? await getVoucherByToken(body.token)
    : body.code
      ? await getVoucherByCode(body.code)
      : null;
  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  const subtotalCents =
    body.subtotal === undefined || body.subtotal === ""
      ? null
      : centsFromDollars(Number(body.subtotal));

  if (body.action === "preview") {
    const preview = await previewRedemption({
      voucher,
      merchantId,
      subtotalCents,
    });
    if (!preview.ok) {
      return NextResponse.json({ error: preview.error }, { status: 409 });
    }
    return NextResponse.json({
      offerTitle: offerTitle(preview.promotion),
      merchantName: preview.promotion.merchant.displayName,
      minimum: `$${(preview.promotion.minimumPurchaseCents / 100).toFixed(2)}`,
      discountType: preview.promotion.discountType,
      needsSubtotal: preview.promotion.discountType === "percentage",
      apply:
        preview.discountCents != null && preview.discountCents > 0
          ? formatApplyDiscount(preview.discountCents)
          : undefined,
    });
  }

  if (body.action === "redeem") {
    const result = await redeemVoucher({
      voucherId: voucher.id,
      merchantId,
      subtotalCents,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      apply: formatApplyDiscount(result.discountCents),
      billed: result.billed,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

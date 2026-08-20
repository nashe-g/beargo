import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ledgerEntries, vouchers } from "@/db/schema";
import { dollarsFromCents } from "@/lib/money";
import { listPromotions, redemptionCount } from "@/lib/promotions";
import { sessionCountsForPromotion } from "@/lib/scan-session";

function rate(num: number, den: number) {
  if (den === 0) return null;
  return (num / den) * 100;
}

export async function merchantDashboard(merchantId: string) {
  const promotions = await listPromotions(merchantId);
  const voucherRows = await db()
    .select()
    .from(vouchers)
    .where(eq(vouchers.merchantId, merchantId));

  let teasersShown = 0;
  let teasersOpened = 0;
  let offerViews = 0;
  let claims = 0;
  let redeemed = 0;
  let recordedSpendCents = 0;

  for (const promotion of promotions) {
    const counts = await sessionCountsForPromotion(promotion.id);
    teasersShown += counts.teasersShown;
    teasersOpened += counts.teasersOpened;
    offerViews += counts.offersViewed;
    claims += counts.claimed;
    redeemed += await redemptionCount(promotion.id);
  }

  for (const voucher of voucherRows) {
    if (voucher.status === "redeemed") {
      recordedSpendCents += voucher.purchaseSubtotalCents ?? 0;
    }
  }

  const feeRows = await db()
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.merchantId, merchantId),
        eq(ledgerEntries.kind, "merchant_fee"),
      ),
    );
  const feesCents = feeRows.reduce((sum, row) => sum + row.amountCents, 0);

  return {
    teasersShown,
    teasersOpened,
    offerViews,
    claims,
    redeemed,
    fees: dollarsFromCents(feesCents),
    teaserOpenRate: rate(teasersOpened, teasersShown),
    claimRate: rate(claims, offerViews),
    redemptionRate: rate(redeemed, claims),
    viewToRedemption: rate(redeemed, offerViews),
    recordedSpend: dollarsFromCents(recordedSpendCents),
    averageCheck:
      redeemed === 0 ? null : dollarsFromCents(recordedSpendCents) / redeemed,
    promotions,
  };
}

export function formatRate(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

import Link from "next/link";
import { MerchantShell, Stat } from "@/components/merchant/MerchantShell";
import { OfferManageList } from "@/components/offers/OfferManageList";
import { formatMoney, formatStamp } from "@/lib/format";
import { requireMerchant } from "@/lib/merchant-auth";
import { formatRate, merchantDashboard } from "@/lib/merchant-stats";
import { displayPromotionStatus, offerTitle } from "@/lib/offer";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const merchant = await requireMerchant();
  const stats = await merchantDashboard(merchant.id);
  const offers = stats.promotions.map((promotion) => ({
    id: promotion.id,
    status: displayPromotionStatus(promotion),
    title: offerTitle(promotion),
    subtitle: promotion.location.name,
    validThrough: promotion.endsAt
      ? formatStamp(
          promotion.endsAt.toISOString(),
          promotion.location.timezone,
        )
      : null,
    reviewNote: promotion.rejectionReason,
    testMode: promotion.testMode,
  }));

  return (
    <MerchantShell merchant={merchant} current="/merchant/dashboard">
      <h1 className="font-display text-4xl">Overview</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Players can see your offer and claim a voucher at no charge. BearGo
        bills $1 when your staff confirms the visit in person.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Offer views"
          value={String(stats.offerViews)}
          note={`${formatRate(stats.claimRate)} claim rate`}
        />
        <Stat
          label="Claims"
          value={String(stats.claims)}
          note={`${formatRate(stats.redemptionRate)} redeemed`}
        />
        <Stat
          label="Redemptions"
          value={String(stats.redeemed)}
          note={`${formatRate(stats.viewToRedemption)} view to redemption`}
        />
        <Stat
          label="BearGo fees"
          value={formatMoney(stats.fees)}
          note="Billed on confirmed visits"
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Teaser opens"
          value={`${stats.teasersOpened} / ${stats.teasersShown}`}
          note={`${formatRate(stats.teaserOpenRate)} open rate`}
        />
        <Stat
          label="Recorded checks"
          value={
            stats.averageCheck == null ? "—" : formatMoney(stats.averageCheck)
          }
          note={
            stats.recordedSpend
              ? `${formatMoney(stats.recordedSpend)} attributed`
              : "Subtotal optional at redeem"
          }
        />
      </div>

      <h2 className="mt-10 font-display text-2xl">Offers</h2>
      <OfferManageList offers={offers} role="merchant" />

      <Link
        href="/merchant/redeem"
        className="mt-10 flex h-14 items-center justify-center rounded-full bg-ink text-paper"
      >
        Redeem a voucher
      </Link>
    </MerchantShell>
  );
}

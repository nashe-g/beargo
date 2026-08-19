import Link from "next/link";
import { MerchantShell, Stat } from "@/components/merchant/MerchantShell";
import { formatMoney } from "@/lib/format";
import { requireMerchant } from "@/lib/merchant-auth";
import { formatRate, merchantDashboard } from "@/lib/merchant-stats";
import { offerTitle } from "@/lib/offer";
import { remainingRedemptions, type PromotionRecord } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const merchant = await requireMerchant();
  const stats = await merchantDashboard(merchant.id);
  const remainingById = Object.fromEntries(
    await Promise.all(
      stats.promotions.map(async (promotion) => [
        promotion.id,
        await remainingRedemptions(promotion),
      ]),
    ),
  ) as Record<string, number>;

  return (
    <MerchantShell merchant={merchant} current="/merchant/dashboard">
      <h1 className="font-display text-4xl">Overview</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        You pay $1 only when staff confirms a real visit. Views and claims are
        free.
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
          note={`${formatMoney(stats.remainingBudget)} remaining cap`}
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
      <PromotionList
        promotions={stats.promotions}
        remainingById={remainingById}
      />

      <Link
        href="/merchant/redeem"
        className="mt-10 flex h-14 items-center justify-center rounded-full bg-ink text-paper"
      >
        Redeem a voucher
      </Link>
    </MerchantShell>
  );
}

function PromotionList({
  promotions,
  remainingById,
}: {
  promotions: PromotionRecord[];
  remainingById: Record<string, number>;
}) {
  if (promotions.length === 0) {
    return <p className="mt-4 text-ink-soft">No offers yet.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {promotions.map((promotion) => {
        const remaining = remainingById[promotion.id];
        return (
          <li
            key={promotion.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="font-display text-2xl">{offerTitle(promotion)}</p>
            <p className="mt-1 text-ink-soft">
              {promotion.status} ·{" "}
              {remaining === Infinity
                ? "No cap"
                : `${remaining} redemptions left`}
              {promotion.testMode ? " · test (no $1 fee)" : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

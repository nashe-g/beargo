import { MerchantShell } from "@/components/merchant/MerchantShell";
import { requireMerchant } from "@/lib/merchant-auth";
import { offerTitle } from "@/lib/offer";
import { listPromotions, remainingRedemptions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function MerchantPromotionsPage() {
  const merchant = await requireMerchant();
  const promotions = await listPromotions(merchant.id);
  const remainingById = Object.fromEntries(
    await Promise.all(
      promotions.map(async (promotion) => [
        promotion.id,
        await remainingRedemptions(promotion),
      ]),
    ),
  ) as Record<string, number>;

  return (
    <MerchantShell merchant={merchant} current="/merchant/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 text-ink-soft">
        BearGo shows one nearby offer after the game. You pay $1 only on
        redemption.
      </p>
      <ul className="mt-8 space-y-4">
        {promotions.length === 0 ? (
          <li className="text-ink-soft">
            No offers yet. Ask BearGo to create one.
          </li>
        ) : (
          promotions.map((promotion) => {
            const remaining = remainingById[promotion.id];
            return (
              <li
                key={promotion.id}
                className="rounded-3xl border border-ink/10 px-5 py-5"
              >
                <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                  {promotion.status}
                </p>
                <h2 className="mt-1 font-display text-3xl">
                  {offerTitle(promotion)}
                </h2>
                <p className="mt-2 text-ink-soft">{promotion.location.name}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Cap {promotion.maxRedemptions ?? "none"} · remaining{" "}
                  {remaining === Infinity ? "unlimited" : remaining}
                  {promotion.testMode ? " · test (no $1 fee)" : ""}
                </p>
                {promotion.shortTerms ? (
                  <p className="mt-3">{promotion.shortTerms}</p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </MerchantShell>
  );
}

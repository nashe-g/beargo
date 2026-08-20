import { MerchantShell } from "@/components/merchant/MerchantShell";
import { OfferManageList } from "@/components/offers/OfferManageList";
import { requireMerchant } from "@/lib/merchant-auth";
import { offerTitle } from "@/lib/offer";
import { listPromotions, remainingRedemptions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function MerchantPromotionsPage() {
  const merchant = await requireMerchant();
  const promotions = await listPromotions(merchant.id);

  const offers = await Promise.all(
    promotions.map(async (promotion) => {
      const remaining = await remainingRedemptions(promotion);
      return {
        id: promotion.id,
        status: promotion.status,
        title: offerTitle(promotion),
        subtitle: promotion.location.name,
        detail: promotion.location.address,
        shortTerms: promotion.shortTerms,
        maxRedemptions: promotion.maxRedemptions,
        remaining: Number.isFinite(remaining) ? remaining : null,
        testMode: promotion.testMode,
      };
    }),
  );

  return (
    <MerchantShell merchant={merchant} current="/merchant/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        BearGo shows one nearby offer after the game. Players can see it and
        claim a voucher at no charge. BearGo bills $1 when your staff confirms
        the visit in person.
      </p>
      {promotions.length === 0 ? (
        <p className="mt-8 text-ink-soft">
          No offers yet. Ask BearGo to create one.
        </p>
      ) : (
        <OfferManageList offers={offers} role="merchant" />
      )}
    </MerchantShell>
  );
}

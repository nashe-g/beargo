import { AdminShell } from "@/components/admin/AdminShell";
import { CreateOfferForm } from "@/components/admin/CreateOfferForm";
import { OfferManageList } from "@/components/offers/OfferManageList";
import { requireAdmin } from "@/lib/admin-auth";
import { offerTitle } from "@/lib/offer";
import { listPromotions, remainingRedemptions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promotions = await listPromotions();
  const offers = await Promise.all(
    promotions.map(async (promotion) => {
      const remaining = await remainingRedemptions(promotion);
      return {
        id: promotion.id,
        status: promotion.status,
        title: offerTitle(promotion),
        subtitle: promotion.merchant.displayName,
        detail: promotion.location.address,
        shortTerms: promotion.shortTerms,
        maxRedemptions: promotion.maxRedemptions,
        remaining: Number.isFinite(remaining) ? remaining : null,
        testMode: promotion.testMode,
      };
    }),
  );

  return (
    <AdminShell current="/admin/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        One nearby offer after a completed game. BearGo bills the merchant $1
        when staff confirms the visit in person. Add the merchant’s real
        address so it can appear at nearby host Paws.
      </p>
      <div className="mt-6">
        <CreateOfferForm />
      </div>
      {promotions.length === 0 ? (
        <p className="mt-8 text-ink-soft">No offers yet.</p>
      ) : (
        <OfferManageList offers={offers} role="admin" />
      )}
    </AdminShell>
  );
}

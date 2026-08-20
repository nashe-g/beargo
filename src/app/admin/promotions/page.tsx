import { AdminShell } from "@/components/admin/AdminShell";
import { CreateOfferForm } from "@/components/admin/CreateOfferForm";
import { OfferManageList } from "@/components/offers/OfferManageList";
import { requireAdmin } from "@/lib/admin-auth";
import { formatStamp } from "@/lib/format";
import { displayPromotionStatus, offerTitle } from "@/lib/offer";
import { listPromotions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promotions = await listPromotions();
  const offers = promotions.map((promotion) => ({
    id: promotion.id,
    status: displayPromotionStatus(promotion),
    title: offerTitle(promotion),
    subtitle: promotion.merchant.displayName,
    detail: promotion.location.address,
    shortTerms: promotion.shortTerms,
    validThrough: promotion.endsAt
      ? formatStamp(
          promotion.endsAt.toISOString(),
          promotion.location.timezone,
        )
      : null,
    testMode: promotion.testMode,
  }));

  return (
    <AdminShell current="/admin/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        One nearby offer after a completed game. BearGo bills the merchant $1
        when staff confirms the visit in person. Cancel stops new claims.
        Vouchers already issued stay valid through the offer end.
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

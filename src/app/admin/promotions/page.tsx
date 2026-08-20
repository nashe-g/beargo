import { AdminShell } from "@/components/admin/AdminShell";
import { CreateOfferForm } from "@/components/admin/CreateOfferForm";
import { PendingOfferReview } from "@/components/admin/PendingOfferReview";
import { OfferManageList } from "@/components/offers/OfferManageList";
import { requireAdmin } from "@/lib/admin-auth";
import { formatStamp } from "@/lib/format";
import { displayPromotionStatus, offerTitle } from "@/lib/offer";
import { listPromotions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

function card(promotion: Awaited<ReturnType<typeof listPromotions>>[number]) {
  return {
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
    reviewNote: promotion.rejectionReason,
    testMode: promotion.testMode,
  };
}

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promotions = await listPromotions();
  const pending = promotions.filter((row) => row.status === "pending");
  const rest = promotions.filter((row) => row.status !== "pending");

  return (
    <AdminShell current="/admin/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        One nearby offer after a completed game. Merchant-submitted offers wait
        here until you approve. BearGo bills the merchant $1 when staff confirms
        the visit in person. Cancel stops new claims. Vouchers already issued
        stay valid through the offer end.
      </p>
      <PendingOfferReview
        offers={pending.map((promotion) => ({
          id: promotion.id,
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
        }))}
      />
      <div className="mt-6">
        <CreateOfferForm />
      </div>
      {rest.length === 0 ? (
        pending.length === 0 ? (
          <p className="mt-8 text-ink-soft">No offers yet.</p>
        ) : null
      ) : (
        <OfferManageList offers={rest.map(card)} role="admin" />
      )}
    </AdminShell>
  );
}

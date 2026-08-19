import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { offerTitle } from "@/lib/offer";
import { listPromotions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promotions = await listPromotions();
  return (
    <AdminShell current="/admin/promotions">
      <h1 className="font-display text-4xl">Offers</h1>
      <p className="mt-3 text-ink-soft">
        One nearby promotion after a completed game. $1 only on redemption.
      </p>
      <ul className="mt-8 space-y-4">
        {promotions.map((promotion) => (
          <li
            key={promotion.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
              {promotion.merchant.displayName} · {promotion.status}
            </p>
            <h2 className="mt-2 font-display text-2xl">
              {offerTitle(promotion)}
            </h2>
            <p className="mt-2 text-ink-soft">{promotion.location.address}</p>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

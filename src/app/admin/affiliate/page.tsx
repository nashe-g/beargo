import { AdminShell } from "@/components/admin/AdminShell";
import { AffiliateAdmin } from "@/components/admin/AffiliateAdmin";
import { requireAdmin } from "@/lib/admin-auth";
import {
  affiliateEventCounts,
  listAffiliateAdvertisers,
  listAffiliateOffers,
} from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatePage() {
  await requireAdmin();
  const [advertisers, offers, countMap] = await Promise.all([
    listAffiliateAdvertisers(),
    listAffiliateOffers(),
    affiliateEventCounts(),
  ]);
  const counts = Object.fromEntries(countMap.entries());

  return (
    <AdminShell current="/admin/affiliate">
      <h1 className="font-display text-4xl">Affiliate</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Paused. Players do not see affiliate cards. Inventory stays here for
        when there are real deals. A pending advertiser or an unreviewed offer
        will not show even if the flag comes back on.
      </p>
      <div className="mt-8">
        <AffiliateAdmin
          advertisers={advertisers}
          offers={offers}
          counts={counts}
        />
      </div>
    </AdminShell>
  );
}

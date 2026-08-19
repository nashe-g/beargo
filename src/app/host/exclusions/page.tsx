import { HostShell } from "@/components/host/HostShell";
import { HostNearbyOffers } from "@/components/host/HostNearbyOffers";
import { requireHost } from "@/lib/host-auth";
import { listNearbyOffersForHost } from "@/lib/select-promotion";

export const dynamic = "force-dynamic";

export default async function HostExclusionsPage() {
  const host = await requireHost();
  const nearby = await listNearbyOffersForHost(host, { includeBlocked: true });

  return (
    <HostShell host={host} current="/host/exclusions">
      <h1 className="font-display text-4xl">Nearby offers</h1>
      <p className="mt-3 text-ink-soft">
        Players see one offer after they rank: the closest live offer this room
        allows. Block a specific offer if it competes with you.
      </p>
      <HostNearbyOffers
        nearby={nearby}
        excludedPromotionIds={host.excludedPromotionIds}
      />
    </HostShell>
  );
}

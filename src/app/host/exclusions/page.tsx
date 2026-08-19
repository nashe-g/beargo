import { HostShell } from "@/components/host/HostShell";
import { HostExclusionsForm } from "@/components/host/HostExclusionsForm";
import { NearbyOfferCards } from "@/components/offers/NearbyOfferCards";
import { requireHost } from "@/lib/host-auth";
import { listNearbyOffersForHost } from "@/lib/select-promotion";

export const dynamic = "force-dynamic";

export default async function HostExclusionsPage() {
  const host = await requireHost();
  const nearby = await listNearbyOffersForHost(host);

  return (
    <HostShell host={host} current="/host/exclusions">
      <h1 className="font-display text-4xl">Nearby offers</h1>
      <p className="mt-3 text-ink-soft">
        Players see one offer after they rank: the closest live offer that this
        room allows. Block a category if it competes with you.
      </p>
      <NearbyOfferCards nearby={nearby} />

      <h2 className="mt-12 font-display text-2xl">Block categories</h2>
      <p className="mt-3 text-ink-soft">
        BearGo should never advertise a competitor against this room.
      </p>
      <HostExclusionsForm excludedCategories={host.excludedCategories} />
    </HostShell>
  );
}

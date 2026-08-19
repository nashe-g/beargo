import { HostShell } from "@/components/host/HostShell";
import { HostExclusionsForm } from "@/components/host/HostExclusionsForm";
import { requireHost } from "@/lib/host-auth";

export const dynamic = "force-dynamic";

export default async function HostExclusionsPage() {
  const host = await requireHost();
  return (
    <HostShell host={host} current="/host/exclusions">
      <h1 className="font-display text-4xl">Nearby offers</h1>
      <p className="mt-3 text-ink-soft">
        BearGo should never advertise a competitor against this room. Block
        categories you don’t want shown after a game here.
      </p>
      <HostExclusionsForm excludedCategories={host.excludedCategories} />
    </HostShell>
  );
}

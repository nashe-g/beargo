import { HostShell } from "@/components/host/HostShell";
import { requireHost } from "@/lib/host-auth";
import { serviceDayInZone } from "@/lib/dates";
import { formatWobble } from "@/lib/stack";
import { hostNightTableStats } from "@/lib/night-tables";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HostDashboardPage() {
  const host = await requireHost();
  const localDate = serviceDayInZone(host.timezone);
  const night = await hostNightTableStats(host.id, localDate);

  return (
    <HostShell host={host} current="/host/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {localDate}
      </p>
      <h1 className="mt-2 font-display text-4xl">Today</h1>
      <p className="mt-3 text-ink-soft">
        Tables sit, play the test, then the tray. The room opens after.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label="Tables tonight" value={String(night.tables)} />
        <Stat label="Finished the test" value={String(night.finishedTest)} />
        <Stat label="Finished the tray" value={String(night.finishedTray)} />
      </div>

      <p className="mt-8 rounded-3xl bg-ink px-5 py-6 text-paper">
        <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
          Best wobble tonight
        </span>
        <span className="mt-2 block font-display text-3xl">
          {night.bestWobble == null ? "Nobody yet" : formatWobble(night.bestWobble)}
        </span>
      </p>

      <Link
        href="/host/paws"
        className="mt-10 flex h-14 items-center justify-center rounded-full bg-ink text-paper"
      >
        Print or check your Paw
      </Link>
    </HostShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-ink/10 px-4 py-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

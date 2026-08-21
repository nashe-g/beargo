import { HostShell } from "@/components/host/HostShell";
import { requireHost } from "@/lib/host-auth";
import { localDateInZone } from "@/lib/dates";
import { listPlays } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HostDashboardPage() {
  const host = await requireHost();
  const plays = await listPlays();
  const localDate = localDateInZone(host.timezone);
  const todayPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate === localDate,
  );
  const month = localDate.slice(0, 7);
  const monthPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate.startsWith(month),
  );

  return (
    <HostShell host={host} current="/host/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {localDate}
      </p>
      <h1 className="mt-2 font-display text-4xl">Today</h1>
      <p className="mt-3 text-ink-soft">
        The game is the same at every BearGo today. Block a specific offer on
        Offers if it competes with this room.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label="Games finished" value={String(todayPlays.length)} />
        <Stat label="This month" value={String(monthPlays.length)} />
      </div>

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

import { HostShell } from "@/components/host/HostShell";
import { requireHost } from "@/lib/host-auth";
import { getTonightSlate } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { hostNightSnapshot } from "@/lib/night-tables";
import { isFullNightSlate } from "@/lib/question-packs";
import { formatWobble } from "@/lib/stack";
import { tableStatusLabel } from "@/lib/table-copy";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HostDashboardPage() {
  const host = await requireHost();
  const localDate = serviceDayInZone(host.timezone);
  const [night, challenge] = await Promise.all([
    hostNightSnapshot(host.id, localDate),
    getTonightSlate(host.id, host.timezone),
  ]);
  const live = isFullNightSlate(challenge.questions);

  return (
    <HostShell host={host} current="/host/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {localDate}
      </p>
      <h1 className="mt-2 font-display text-4xl">Today</h1>
      <p className="mt-3 text-ink-soft">
        Tables sit, play the test, then the tray. The room opens after.{" "}
        {live
          ? "Tonight’s 21 are published."
          : "Tonight’s 21 aren’t published yet — tables wait at GO."}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label="Tables tonight" value={String(night.tables)} />
        <Stat label="People" value={String(night.people)} />
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

      <h2 className="mt-10 font-display text-2xl">Sitting</h2>
      {night.rows.length === 0 ? (
        <p className="mt-3 text-ink-soft">Nobody at a table yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {night.rows.map((table) => (
            <li
              key={table.joinCode}
              className="rounded-3xl border border-ink/10 px-5 py-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">{table.name}</h3>
                <span className="font-mono text-sm tracking-[0.16em]">
                  {table.joinCode}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {table.people} {table.people === 1 ? "person" : "people"} ·{" "}
                {tableStatusLabel(table.status)}
                {table.round1Rank != null ? ` · test #${table.round1Rank}` : ""}
                {table.combinedRank != null
                  ? ` · tonight #${table.combinedRank}`
                  : ""}
                {table.skipped
                  ? " · skipped the tray"
                  : table.wobble != null
                    ? ` · wobble ${formatWobble(table.wobble)}`
                    : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

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

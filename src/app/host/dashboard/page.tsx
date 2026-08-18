import Link from "next/link";
import { HostShell } from "@/components/host/HostShell";
import { formatClock, formatMoney } from "@/lib/format";
import { getDemoHost } from "@/lib/hosts";
import { hostMonthStats, hostTodayStats } from "@/lib/host-stats";
import { todaysSponsorForHostRecord } from "@/lib/route-campaign";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HostDashboardPage() {
  const host = getDemoHost();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const today = hostTodayStats(host, plays, leads);
  const month = hostMonthStats(host, plays, leads);
  const sponsor = todaysSponsorForHostRecord(host);

  return (
    <HostShell host={host} current="/host/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {today.localDate}
      </p>
      <h1 className="mt-2 font-display text-4xl">Today</h1>
      <p className="mt-3 text-ink-soft">
        {sponsor
          ? `Today’s sponsor: ${sponsor.name}. Potential host share ${formatMoney(sponsor.hostAmount)} on a qualified introduction.`
          : "No sponsor on the floor today. The game still runs."}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label="Games finished" value={String(today.gamesFinished)} />
        <Stat label="Qualified leads" value={String(today.qualifiedLeads)} />
        <Stat label="Introductions started" value={String(today.introductionsStarted)} />
        <Stat label="Potential today" value={formatMoney(today.earnings)} />
      </div>

      <p className="mt-8 rounded-3xl bg-ink px-5 py-6 text-paper">
        <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
          Fastest 3 / 3 today
        </span>
        <span className="mt-2 block font-display text-3xl">
          {today.fastestPerfectMs == null
            ? "Nobody yet"
            : formatClock(today.fastestPerfectMs)}
        </span>
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl">This month</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Games" value={String(month.gamesFinished)} />
          <Stat label="Qualified leads" value={String(month.qualifiedLeads)} />
          <Stat label="Potential" value={formatMoney(month.earnings)} />
          <Stat
            label="Potential / 100 games"
            value={
              month.earningsPerHundredGames == null
                ? "—"
                : formatMoney(month.earningsPerHundredGames)
            }
          />
        </div>
      </section>

      <p className="mt-6 text-sm text-ink-soft">
        Dollar amounts are potential, using a working model. Live rates come
        after launch.
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

import { StartupShell, Stat } from "@/components/startup/StartupShell";
import { interestLabel } from "@/lib/campaigns";
import { campaignsForStartup } from "@/lib/campaign-resolve";
import { formatMoney } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import {
  leadsForStartup,
  performanceForStartup,
  sourceRows,
} from "@/lib/startup-stats";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupDashboardPage() {
  const startup = await requireStartup();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const stats = await performanceForStartup(startup.id, plays, leads);
  const sources = await sourceRows(startup.id, plays, leads);
  const interestMix = mix(
    leadsForStartup(startup.id, leads).map((lead) => lead.interestId),
  );
  const live = (await campaignsForStartup(startup.id)).filter(
    (campaign) => campaign.status === "live",
  );

  return (
    <StartupShell startup={startup} current="/startup/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        Performance
      </p>
      <h1 className="mt-2 font-display text-4xl">Overview</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Your sponsor appears after a completed real-world game. You only pay
        for qualified people who choose to connect.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Live campaigns"
          value={String(stats.liveCount)}
          note={live.map((campaign) => campaign.name).join(" · ") || "None live"}
        />
        <Stat
          label="Qualified leads"
          value={String(stats.funnel.qualifiedLeads)}
        />
        <Stat
          label="CPL"
          value={formatMoney(stats.cpl)}
          note="Fixed. Not billed on games or views."
        />
        <Stat
          label="Spend"
          value={formatMoney(stats.spend)}
          note={`${formatMoney(stats.remaining)} remaining of ${formatMoney(stats.funded)}`}
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Funnel</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Games on floor are completions on days your campaign was the sponsor.
          Scan and teaser counts come after session tracking. Nothing above a
          Qualified Lead is billed.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          <FunnelStep
            label="Games on your floor"
            value={stats.funnel.gamesOnFloor}
          />
          <FunnelStep
            label="Introductions started"
            value={stats.funnel.introductionsStarted}
          />
          <FunnelStep label="Duplicates" value={stats.funnel.duplicates} />
          <FunnelStep
            label="Emails verified"
            value={stats.funnel.emailsVerified}
          />
          <FunnelStep
            label="Qualified leads"
            value={stats.funnel.qualifiedLeads}
            strong
          />
        </ol>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Source</h2>
          {sources.length === 0 ? (
            <p className="mt-4 text-ink-soft">No hosts assigned yet.</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="pb-3 font-normal">Host</th>
                  <th className="pb-3 font-normal">Games</th>
                  <th className="pb-3 font-normal">Intros</th>
                  <th className="pb-3 font-normal">QLs</th>
                  <th className="pb-3 font-normal">Spend</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((row) => (
                  <tr key={row.hostId} className="border-t border-ink/10">
                    <td className="py-3">{row.hostName}</td>
                    <td>{row.gamesOnFloor}</td>
                    <td>{row.introductions}</td>
                    <td>{row.qualifiedLeads}</td>
                    <td>{formatMoney(row.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl">Interest</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Among people who started an introduction.
          </p>
          {interestMix.length === 0 ? (
            <p className="mt-4 text-ink-soft">None yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {interestMix.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl bg-paper-deep px-4 py-3"
                >
                  <span>{interestLabel(row.id)}</span>
                  <span className="font-display text-xl">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </StartupShell>
  );
}

function FunnelStep({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <li
      className={`rounded-3xl px-4 py-5 ${
        strong ? "bg-ink text-paper" : "border border-ink/10"
      }`}
    >
      <p className={`text-sm ${strong ? "text-paper/60" : "text-ink-soft"}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </li>
  );
}

function mix(ids: string[]) {
  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

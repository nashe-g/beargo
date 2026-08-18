import { StartupShell, Stat } from "@/components/startup/StartupShell";
import { formatMoney } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import { performanceForStartup } from "@/lib/startup-stats";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupBillingPage() {
  const startup = await requireStartup();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const stats = performanceForStartup(startup.id, plays, leads);

  return (
    <StartupShell startup={startup} current="/startup/billing">
      <h1 className="font-display text-4xl">Billing</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Working model on Qualified Leads only. No invoices, no card on file,
        and no live charges yet.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Funded" value={formatMoney(stats.funded)} />
        <Stat label="Spend" value={formatMoney(stats.spend)} />
        <Stat label="Remaining" value={formatMoney(stats.remaining)} />
        <Stat
          label="Qualified leads"
          value={String(stats.funnel.qualifiedLeads)}
        />
      </div>

      <h2 className="mt-12 font-display text-2xl">By campaign</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-ink-soft">
          <tr>
            <th className="pb-3 font-normal">Campaign</th>
            <th className="pb-3 font-normal">CPL</th>
            <th className="pb-3 font-normal">QLs</th>
            <th className="pb-3 font-normal">Spend</th>
            <th className="pb-3 font-normal">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {stats.campaigns.map(({ campaign, funnel, spend, remaining }) => (
            <tr key={campaign.id} className="border-t border-ink/10">
              <td className="py-3">{campaign.name}</td>
              <td>{formatMoney(campaign.grossCpl)}</td>
              <td>{funnel.qualifiedLeads}</td>
              <td>{formatMoney(spend)}</td>
              <td>{formatMoney(remaining)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 rounded-3xl bg-paper-deep px-5 py-5 text-sm text-ink-soft">
        Payment method and invoices land with live billing. You will not be
        asked to wire a webhook or install an SDK.
      </p>
    </StartupShell>
  );
}

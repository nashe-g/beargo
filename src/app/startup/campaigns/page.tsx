import Link from "next/link";
import { StartupShell, StatusPill } from "@/components/startup/StartupShell";
import { formatMoney } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import { performanceForStartup } from "@/lib/startup-stats";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupCampaignsPage() {
  const startup = await requireStartup();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const stats = await performanceForStartup(startup.id, plays, leads);

  return (
    <StartupShell startup={startup} current="/startup/campaigns">
      <h1 className="font-display text-4xl">Campaigns</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Manual routing for now. Creative and terms are view-only here. Admin
        assigns hosts.
      </p>

      <ul className="mt-8 space-y-4">
        {stats.campaigns.map(({ campaign, funnel, spend, remaining }) => (
          <li key={campaign.id}>
            <Link
              href={`/startup/campaigns/${campaign.id}`}
              className="block rounded-3xl border border-ink/10 px-6 py-6 hover:bg-paper-deep"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl">{campaign.name}</h2>
                <StatusPill status={campaign.status} />
              </div>
              <p className="mt-2 text-ink-soft">{campaign.valueProposition}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Item label="CPL" value={formatMoney(campaign.grossCpl)} />
                <Item
                  label="Qualified leads"
                  value={String(funnel.qualifiedLeads)}
                />
                <Item label="Spend" value={formatMoney(spend)} />
                <Item label="Remaining" value={formatMoney(remaining)} />
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </StartupShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-xl">{value}</dd>
    </div>
  );
}

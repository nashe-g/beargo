import { notFound } from "next/navigation";
import { StartupShell, Stat, StatusPill } from "@/components/startup/StartupShell";
import { getCampaign } from "@/lib/campaign-resolve";
import { formatMoney } from "@/lib/format";
import { getHost } from "@/lib/hosts";
import { requireStartup } from "@/lib/startup-auth";
import { performanceForCampaign } from "@/lib/startup-stats";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupCampaignPage({
  params,
}: PageProps<"/startup/campaigns/[campaignId]">) {
  const startup = await requireStartup();
  const { campaignId } = await params;
  const campaign = getCampaign(campaignId);
  if (!campaign || campaign.startupId !== startup.id) notFound();

  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const { funnel, spend, remaining } = performanceForCampaign(
    campaign,
    plays,
    leads,
  );

  return (
    <StartupShell startup={startup} current="/startup/campaigns">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">{campaign.name}</h1>
        <StatusPill status={campaign.status} />
      </div>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {campaign.valueProposition}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="CPL" value={formatMoney(campaign.grossCpl)} />
        <Stat
          label="Qualified leads"
          value={String(funnel.qualifiedLeads)}
        />
        <Stat label="Spend" value={formatMoney(spend)} />
        <Stat label="Remaining" value={formatMoney(remaining)} />
      </div>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="rounded-3xl bg-ink px-6 py-6 text-paper">
          <p className="text-sm tracking-[0.2em] text-honey uppercase">
            {campaign.headline}
          </p>
          <h2 className="mt-3 font-display text-3xl">{campaign.name}</h2>
          <p className="mt-3 text-paper/75">{campaign.valueProposition}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Terms</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Host share" value={formatMoney(campaign.hostAmount)} />
            <Row
              label="Platform share"
              value={formatMoney(campaign.platformAmount)}
            />
            <Row
              label="Funded balance"
              value={formatMoney(campaign.fundedBalance)}
            />
            <Row
              label="Assigned hosts"
              value={
                campaign.eligibleHostIds
                  .map((id) => getHost(id)?.displayName ?? id)
                  .join(", ") || "None"
              }
            />
          </dl>
          <p className="mt-4 text-sm text-ink-soft">
            Working model. Live billing comes after launch.
          </p>
        </div>
      </section>
    </StartupShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

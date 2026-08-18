import { notFound } from "next/navigation";
import { AdminShell, Stat, StatusPill } from "@/components/admin/AdminShell";
import { CampaignControls } from "@/components/admin/CampaignControls";
import { requireAdmin } from "@/lib/admin-auth";
import { getCampaign } from "@/lib/campaign-resolve";
import { formatMoney } from "@/lib/format";
import { listHosts } from "@/lib/hosts";
import { performanceForCampaign } from "@/lib/startup-stats";
import { getStartup } from "@/lib/startups";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminCampaignPage({
  params,
}: PageProps<"/admin/campaigns/[campaignId]">) {
  await requireAdmin();
  const { campaignId } = await params;
  const campaign = getCampaign(campaignId);
  if (!campaign) notFound();

  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const stats = performanceForCampaign(campaign, plays, leads);
  const startup = getStartup(campaign.startupId);

  return (
    <AdminShell current="/admin/campaigns">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">{campaign.name}</h1>
        <StatusPill status={campaign.status} />
      </div>
      <p className="mt-3 text-ink-soft">
        {startup?.displayName}. {campaign.valueProposition}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="CPL" value={formatMoney(campaign.grossCpl)} />
        <Stat
          label="Qualified leads"
          value={String(stats.funnel.qualifiedLeads)}
        />
        <Stat label="Spend" value={formatMoney(stats.spend)} />
        <Stat label="Remaining" value={formatMoney(stats.remaining)} />
      </div>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="rounded-3xl bg-ink px-6 py-6 text-paper">
          <p className="text-sm tracking-[0.2em] text-honey uppercase">
            {campaign.headline}
          </p>
          <h2 className="mt-3 font-display text-3xl">{campaign.name}</h2>
          <p className="mt-3 text-paper/75">{campaign.valueProposition}</p>
        </div>
        <CampaignControls campaign={campaign} hosts={listHosts()} />
      </section>
    </AdminShell>
  );
}

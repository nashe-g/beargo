import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listCampaigns } from "@/lib/campaign-resolve";
import { formatMoney } from "@/lib/format";
import { getHost, listHosts } from "@/lib/hosts";
import { todaysSponsorForHostRecord } from "@/lib/route-campaign";
import { performanceForCampaign } from "@/lib/startup-stats";
import { getStartup } from "@/lib/startups";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const campaigns = listCampaigns();
  const hosts = listHosts();
  const onFloor = new Set(
    hosts
      .map((host) => todaysSponsorForHostRecord(host)?.id)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <AdminShell current="/admin/campaigns">
      <h1 className="font-display text-4xl">Campaigns</h1>
      <p className="mt-3 text-ink-soft">
        Manual routing. Pause or reassign hosts and the scanner picks it up
        the same day.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Campaign</th>
              <th className="pb-3 font-normal">Startup</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 font-normal">Hosts</th>
              <th className="pb-3 font-normal">On floor</th>
              <th className="pb-3 font-normal">QLs</th>
              <th className="pb-3 font-normal">Spend</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const stats = performanceForCampaign(campaign, plays, leads);
              return (
                <tr key={campaign.id} className="border-t border-ink/10">
                  <td className="py-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </td>
                  <td>{getStartup(campaign.startupId)?.displayName}</td>
                  <td>
                    <StatusPill status={campaign.status} />
                  </td>
                  <td>
                    {campaign.eligibleHostIds
                      .map((id) => getHost(id)?.displayName ?? id)
                      .join(", ") || "—"}
                  </td>
                  <td>{onFloor.has(campaign.id) ? "Today" : "—"}</td>
                  <td>{stats.funnel.qualifiedLeads}</td>
                  <td>{formatMoney(stats.spend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

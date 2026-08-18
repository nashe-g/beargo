import Link from "next/link";
import { StartupShell, StatusPill } from "@/components/startup/StartupShell";
import {
  interestLabel,
  qualificationSummary,
} from "@/lib/campaigns";
import { getCampaign } from "@/lib/campaign-resolve";
import { formatMoney, formatStamp } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import {
  canRevealContact,
  hostNameForLead,
  leadsForStartup,
  placementForLead,
} from "@/lib/startup-stats";
import { listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupLeadsPage() {
  const startup = await requireStartup();
  const leads = leadsForStartup(startup.id, await listLeads());

  return (
    <StartupShell startup={startup} current="/startup/leads">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Leads</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Contact details appear after a Qualified Lead. Until then you see
            status and source only — consent hasn’t been given.
          </p>
        </div>
        <Link
          href="/startup/exports"
          className="flex h-12 items-center rounded-full bg-ink px-5 text-paper"
        >
          Export CSV
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          No introductions yet. Play the demo when this campaign is today’s
          sponsor.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="pb-3 font-normal">Lead</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal">Contact</th>
                <th className="pb-3 font-normal">Interest</th>
                <th className="pb-3 font-normal">Source</th>
                <th className="pb-3 font-normal">CPL</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const campaign = getCampaign(lead.campaignId);
                const revealed = canRevealContact(lead);
                return (
                  <tr key={lead.id} className="border-t border-ink/10">
                    <td className="py-4">
                      <Link
                        href={`/startup/leads/${lead.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {revealed ? lead.fullName : shortId(lead.id)}
                      </Link>
                      <p className="text-ink-soft">
                        {formatStamp(lead.createdAt, "America/Chicago")}
                      </p>
                    </td>
                    <td>
                      <StatusPill status={lead.status} />
                    </td>
                    <td>
                      {revealed ? (
                        <>
                          <p>{lead.email}</p>
                          <p className="text-ink-soft">{lead.phone}</p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <p>{interestLabel(lead.interestId)}</p>
                      {revealed ? (
                        <p className="text-ink-soft">
                          {qualificationSummary(campaign, lead.qualification)}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <p>{hostNameForLead(lead)}</p>
                      <p className="text-ink-soft">{placementForLead(lead)}</p>
                    </td>
                    <td>
                      {lead.status === "qualified"
                        ? formatMoney(lead.grossCpl ?? campaign?.grossCpl ?? 0)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </StartupShell>
  );
}

function shortId(id: string) {
  return id.slice(0, 8);
}

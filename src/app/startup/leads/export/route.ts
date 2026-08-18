import { cookies } from "next/headers";
import {
  interestLabel,
  qualificationSummary,
} from "@/lib/campaigns";
import { getCampaign } from "@/lib/campaign-resolve";
import { STARTUP_COOKIE } from "@/lib/startup-auth";
import { getStartup } from "@/lib/startups";
import {
  hostNameForLead,
  placementForLead,
  qualifiedLeadsForStartup,
} from "@/lib/startup-stats";
import { listLeads, recordExport } from "@/lib/store";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const id = (await cookies()).get(STARTUP_COOKIE)?.value;
  const startup = id ? getStartup(id) : null;
  if (!startup) {
    return Response.redirect(new URL("/startup", request.url));
  }

  const qualified = qualifiedLeadsForStartup(startup.id, await listLeads());
  await recordExport(startup.id, qualified.length);

  const header = [
    "lead_id",
    "name",
    "email",
    "phone",
    "interest",
    "qualification",
    "host",
    "placement",
    "qualified_at",
    "cpl",
    "campaign",
  ];
  const rows = qualified.map((lead) => {
    const campaign = getCampaign(lead.campaignId);
    return [
      lead.id,
      lead.fullName,
      lead.email,
      lead.phone,
      interestLabel(lead.interestId),
      qualificationSummary(campaign, lead.qualification),
      hostNameForLead(lead),
      placementForLead(lead),
      lead.qualifiedAt ?? "",
      String(lead.grossCpl ?? campaign?.grossCpl ?? ""),
      campaign?.name ?? lead.campaignId,
    ].map(csvCell);
  });

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `beargo-leads-${startup.id}-${stamp}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

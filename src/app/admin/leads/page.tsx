import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { getCampaign } from "@/lib/campaign-resolve";
import { formatMoney, formatStamp } from "@/lib/format";
import { getHost } from "@/lib/hosts";
import { getStartup } from "@/lib/startups";
import { listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  await requireAdmin();
  const query = await searchParams;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const startupId = Array.isArray(query.startup)
    ? query.startup[0]
    : query.startup;
  const hostId = Array.isArray(query.host) ? query.host[0] : query.host;

  const leads = (await listLeads())
    .filter((lead) => (status ? lead.status === status : true))
    .filter((lead) => (startupId ? lead.startupId === startupId : true))
    .filter((lead) => (hostId ? lead.hostId === hostId : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <AdminShell current="/admin/leads">
      <h1 className="font-display text-4xl">Leads</h1>
      <p className="mt-3 text-ink-soft">
        Ops view. Contact is visible here for support and fraud, including
        in-progress introductions.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Filter href="/admin/leads" label="All" active={!status} />
        <Filter
          href="/admin/leads?status=qualified"
          label="Qualified"
          active={status === "qualified"}
        />
        <Filter
          href="/admin/leads?status=pending_verification"
          label="Pending"
          active={status === "pending_verification"}
        />
        <Filter
          href="/admin/leads?status=duplicate"
          label="Duplicates"
          active={status === "duplicate"}
        />
      </div>
      {leads.length === 0 ? (
        <p className="mt-10 text-ink-soft">No leads match.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="pb-3 font-normal">When</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal">Person</th>
                <th className="pb-3 font-normal">Startup</th>
                <th className="pb-3 font-normal">Host</th>
                <th className="pb-3 font-normal">CPL</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-ink/10">
                  <td className="py-3">
                    <Link href={`/admin/leads/${lead.id}`}>
                      {formatStamp(lead.createdAt, "America/Chicago")}
                    </Link>
                  </td>
                  <td>
                    <StatusPill status={lead.status} />
                  </td>
                  <td>
                    <p>{lead.fullName}</p>
                    <p className="text-ink-soft">{lead.email}</p>
                  </td>
                  <td>
                    {getStartup(lead.startupId)?.displayName} ·{" "}
                    {getCampaign(lead.campaignId)?.name}
                  </td>
                  <td>{getHost(lead.hostId)?.displayName ?? lead.hostId}</td>
                  <td>
                    {lead.status === "qualified"
                      ? formatMoney(lead.grossCpl ?? 0)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function Filter({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 ${
        active ? "bg-ink text-paper" : "border border-ink/15"
      }`}
    >
      {label}
    </Link>
  );
}

import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateHostForm } from "@/components/admin/CreateHostForm";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { formatMoney } from "@/lib/format";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHostsPage() {
  await requireAdmin();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const rows = await adminHostRows(plays, leads);

  return (
    <AdminShell current="/admin/hosts">
      <h1 className="font-display text-4xl">Hosts</h1>
      <p className="mt-3 text-ink-soft">
        Today’s games, floor sponsor, and assigned campaigns.
      </p>
      <div className="mt-6">
        <CreateHostForm />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Games today</th>
              <th className="pb-3 font-normal">QLs today</th>
              <th className="pb-3 font-normal">Potential</th>
              <th className="pb-3 font-normal">Sponsor</th>
              <th className="pb-3 font-normal">Paws</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.host.id} className="border-t border-ink/10">
                <td className="py-3">
                  <Link
                    href={`/admin/hosts/${row.host.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {row.host.displayName}
                  </Link>
                </td>
                <td>{row.today.gamesFinished}</td>
                <td>{row.today.qualifiedLeads}</td>
                <td>{formatMoney(row.today.earnings)}</td>
                <td>{row.sponsor ? row.sponsor.name : "—"}</td>
                <td>{row.paws.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

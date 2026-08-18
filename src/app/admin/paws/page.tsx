import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { CANONICAL_ORIGIN, pawScanUrl } from "@/lib/config";
import { getHost } from "@/lib/hosts";
import { listPaws } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function AdminPawsPage() {
  await requireAdmin();
  const paws = listPaws();

  return (
    <AdminShell current="/admin/paws">
      <h1 className="font-display text-4xl">Paws</h1>
      <p className="mt-3 text-ink-soft">
        Physical inventory. Print stays sponsor-free.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Token</th>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Placement</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 font-normal">Today’s sponsor</th>
              <th className="pb-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {paws.map((paw) => {
              const host = getHost(paw.hostId);
              const sponsor = todaysSponsor(paw);
              return (
                <tr key={paw.token} className="border-t border-ink/10">
                  <td className="py-3 font-mono">{paw.token}</td>
                  <td>{host?.displayName ?? paw.hostDisplayName}</td>
                  <td>{paw.placementLabel}</td>
                  <td>
                    <StatusPill status={paw.status} />
                  </td>
                  <td>{sponsor?.name ?? "None"}</td>
                  <td className="space-x-3 text-right">
                    <Link href={`/p/${paw.token}`}>Scan</Link>
                    <Link href={`/p/${paw.token}/print`}>Print</Link>
                    <span className="text-ink-soft">
                      {pawScanUrl(paw.token, CANONICAL_ORIGIN).replace(
                        "https://",
                        "",
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

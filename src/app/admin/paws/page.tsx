import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { CreatePawForm } from "@/components/admin/CreatePawForm";
import { PawSvgDownloads } from "@/components/paw/PawSvgDownloads";
import { requireAdmin } from "@/lib/admin-auth";
import { CANONICAL_ORIGIN, pawScanUrl } from "@/lib/config";
import { getHost, listHosts } from "@/lib/hosts";
import { listPaws } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function AdminPawsPage() {
  await requireAdmin();
  const [paws, hosts] = await Promise.all([listPaws(), listHosts()]);
  const rows = await Promise.all(
    paws.map(async (paw) => ({
      paw,
      host: await getHost(paw.hostId),
    })),
  );

  return (
    <AdminShell current="/admin/paws">
      <h1 className="font-display text-4xl">Paws</h1>
      <p className="mt-3 text-ink-soft">
        Physical inventory. BearGo assigns a unique token for the scan URL.
        Placement is where you put the sticker. Print stays offer-free.
      </p>
      <div className="mt-6">
        <CreatePawForm hosts={hosts} />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Token</th>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Placement</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ paw, host }) => (
              <tr key={paw.token} className="border-t border-ink/10">
                <td className="py-3 font-mono">{paw.token}</td>
                <td>{host?.displayName ?? paw.hostDisplayName}</td>
                <td>{paw.placementLabel}</td>
                <td>
                  <StatusPill status={paw.status} />
                </td>
                <td className="py-3 text-right">
                  <div className="space-x-3">
                    <Link href={`/p/${paw.token}`}>Scan</Link>
                    <Link href={`/p/${paw.token}/print`}>Print</Link>
                  </div>
                  <div className="mt-1">
                    <PawSvgDownloads token={paw.token} compact />
                  </div>
                  <span className="text-ink-soft">
                    {pawScanUrl(paw.token, CANONICAL_ORIGIN).replace(
                      "https://",
                      "",
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

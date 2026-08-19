import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateHostForm } from "@/components/admin/CreateHostForm";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { offerTitle } from "@/lib/offer";
import { listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHostsPage() {
  await requireAdmin();
  const plays = await listPlays();
  const rows = await adminHostRows(plays);

  return (
    <AdminShell current="/admin/hosts">
      <h1 className="font-display text-4xl">Hosts</h1>
      <p className="mt-3 text-ink-soft">
        Add the venue’s street address. Nearby offers route from those
        coordinates, not from a player’s phone GPS.
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
              <th className="pb-3 font-normal">Nearby offer</th>
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
                <td className="py-3">
                  {row.nearby[0] ? (
                    <div>
                      <p>
                        {offerTitle(row.nearby[0].promotion)} ·{" "}
                        {row.nearby[0].promotion.merchant.displayName}
                      </p>
                      <p className="text-ink-soft">
                        {row.nearby[0].card.distanceLabel}
                        {row.nearby.length > 1
                          ? ` · +${row.nearby.length - 1} more in range`
                          : ""}
                      </p>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{row.paws.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

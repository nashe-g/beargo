import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateHostForm } from "@/components/admin/CreateHostForm";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { emailsForHost } from "@/lib/auth";
import { offerTitle } from "@/lib/offer";

export const dynamic = "force-dynamic";

export default async function AdminHostsPage() {
  await requireAdmin();
  const rows = await adminHostRows();
  const logins = Object.fromEntries(
    await Promise.all(
      rows.map(async (row) => [row.host.id, await emailsForHost(row.host.id)]),
    ),
  ) as Record<string, string[]>;

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
              <th className="pb-3 font-normal">Login</th>
              <th className="pb-3 font-normal">Tables tonight</th>
              <th className="pb-3 font-normal">People</th>
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
                  <td className="py-3 text-ink-soft">
                    {logins[row.host.id]?.join(", ") || "None yet"}
                  </td>
                  <td>{row.night.tables}</td>
                  <td>{row.night.people}</td>
                <td className="py-3">
                  {(() => {
                    const shown = row.nearby.find(
                      (item) =>
                        !row.host.excludedPromotionIds.includes(
                          item.promotion.id,
                        ),
                    );
                    const extra = row.nearby.filter(
                      (item) => item.promotion.id !== shown?.promotion.id,
                    ).length;
                    if (!shown) return "—";
                    return (
                      <div>
                        <p>
                          {offerTitle(shown.promotion)} ·{" "}
                          {shown.promotion.merchant.displayName}
                        </p>
                        <p className="text-ink-soft">
                          {shown.card.distanceLabel}
                          {extra > 0 ? ` · +${extra} more in range` : ""}
                        </p>
                      </div>
                    );
                  })()}
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

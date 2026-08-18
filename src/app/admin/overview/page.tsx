import Link from "next/link";
import { AdminShell, Stat } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminOverview } from "@/lib/admin-stats";
import { formatMoney } from "@/lib/format";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const stats = await adminOverview(plays, leads);

  return (
    <AdminShell current="/admin/overview">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {stats.today}
      </p>
      <h1 className="mt-2 font-display text-4xl">Network</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Game first, then commercial, then money. Scan counts wait on session
        tracking. Amounts are the working model, not live billing.
      </p>

      <h2 className="mt-10 font-display text-2xl">Game</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Games today" value={String(stats.gamesToday)} />
        <Stat label="Games all-time" value={String(stats.gamesAll)} />
        <Stat label="Hosts" value={String(stats.hostCount)} />
        <Stat label="Paws" value={String(stats.pawCount)} />
      </div>

      <h2 className="mt-10 font-display text-2xl">Commercial</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Intros today" value={String(stats.introsToday)} />
        <Stat label="Duplicates today" value={String(stats.duplicatesToday)} />
        <Stat label="Verified today" value={String(stats.verifiedToday)} />
        <Stat label="QLs today" value={String(stats.qlsToday)} />
      </div>

      <h2 className="mt-10 font-display text-2xl">Money</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Startup spend today"
          value={formatMoney(stats.spendToday)}
          note={`${formatMoney(stats.spendAll)} all-time QLs`}
        />
        <Stat
          label="Host potential today"
          value={formatMoney(stats.hostPotentialToday)}
        />
        <Stat label="Live campaigns" value={String(stats.liveCampaigns)} />
        <Stat label="Paused" value={String(stats.pausedCampaigns)} />
      </div>

      <h2 className="mt-10 font-display text-2xl">On the floor today</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-ink-soft">
          <tr>
            <th className="pb-3 font-normal">Host</th>
            <th className="pb-3 font-normal">Sponsor</th>
          </tr>
        </thead>
        <tbody>
          {stats.floor.map((row) => (
            <tr key={row.host.id} className="border-t border-ink/10">
              <td className="py-3">
                <Link
                  href={`/admin/hosts/${row.host.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  {row.host.displayName}
                </Link>
              </td>
              <td>
                {row.sponsor ? (
                  <Link href={`/admin/campaigns/${row.sponsor.id}`}>
                    {row.sponsor.name}
                  </Link>
                ) : (
                  <span className="text-ink-soft">None — game still runs</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}

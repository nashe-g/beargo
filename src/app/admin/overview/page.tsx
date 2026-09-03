import { AdminShell, Stat } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listHosts, listPaws } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { listMerchants, listPromotions } from "@/lib/promotions";
import { listPlayers } from "@/lib/players";
import { listPlays } from "@/lib/store";
import { serviceDayInZone } from "@/lib/dates";
import { tableSpreadStats } from "@/lib/table-spread";
import { dollarsFromCents } from "@/lib/money";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { listHorizonSlates, horizonReadyCount } from "@/lib/question-slate-store";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [plays, hosts, paws, merchants, promotions, fees, playerRows, days, spread] =
    await Promise.all([
    listPlays(),
    listHosts(),
    listPaws(),
    listMerchants(),
    listPromotions(),
    db()
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.kind, "merchant_fee")),
    listPlayers(),
    listHorizonSlates(),
    tableSpreadStats(),
  ]);
  const today = serviceDayInZone(BEARGO_DAY_ZONE);
  const gamesToday = plays.filter((play) => play.localDate === today).length;
  const weekReady = horizonReadyCount(days);

  return (
    <AdminShell current="/admin/overview">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">{today}</p>
      <h1 className="mt-2 font-display text-4xl">Network</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Scan lands in the room chat. The House talks first. Games are dares
        in the conversation. Sponsorships are off.
      </p>
      <h2 className="mt-10 font-display text-2xl">Game</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Games tonight" value={String(gamesToday)} />
        <Stat
          label="At the bar tonight"
          value={String(
            plays.filter(
              (play) =>
                play.localDate === today && play.playSource === "in_bar",
            ).length,
          )}
          note="Physical paw scans"
        />
        <Stat
          label="From a share tonight"
          value={String(
            plays.filter(
              (play) =>
                play.localDate === today && play.playSource === "share_link",
            ).length,
          )}
        />
        <Stat label="Games all-time" value={String(plays.length)} />
        <Stat
          label="Table Spread (5 min)"
          value={spread.spread5m == null ? "—" : spread.spread5m.toFixed(2)}
          note={`${spread.followOn5m} follow-on of ${spread.starts} starts · ${spread.followOn2m} in 2m · ${spread.followOn10m} in 10m`}
        />
        <Stat
          label="Next 7 days"
          value={`${weekReady}/7`}
          note="Published network slates"
        />
        <Stat label="Hosts" value={String(hosts.length)} />
        <Stat label="Paws" value={String(paws.length)} />
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        <Link href="/admin/challenges" className="underline-offset-2 hover:underline">
          Generate next week’s questions
        </Link>
      </p>
      <h2 className="mt-10 font-display text-2xl">Promotions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Merchants" value={String(merchants.length)} />
        <Stat
          label="Live offers"
          value={String(promotions.filter((row) => row.status === "live").length)}
        />
        <Stat
          label="Players"
          value={String(playerRows.length)}
          note={`${playerRows.filter((row) => row.emailVerifiedAt).length} verified`}
        />
        <Stat label="Redemptions billed" value={String(fees.length)} />
        <Stat
          label="Accrued fees"
          value={formatMoney(
            dollarsFromCents(fees.reduce((sum, row) => sum + row.amountCents, 0)),
          )}
        />
      </div>
      <h2 className="mt-10 font-display text-2xl">Hosts</h2>
      <ul className="mt-4 space-y-2">
        {hosts.map((host) => (
          <li key={host.id}>
            <Link
              href={`/admin/hosts/${host.id}`}
              className="underline-offset-2 hover:underline"
            >
              {host.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

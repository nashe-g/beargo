import { AdminShell, Stat } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listHosts, listPaws } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { listMerchants, listPromotions } from "@/lib/promotions";
import { listPlayers } from "@/lib/players";
import { scanSourcesTonight } from "@/lib/feed-presence";
import { tableSpreadStats } from "@/lib/table-spread";
import { dollarsFromCents } from "@/lib/money";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { networkSlateDate } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { adminHostRows } from "@/lib/admin-stats";
import { networkNightStats } from "@/lib/night-tables";
import { isFullNightSlate } from "@/lib/question-packs";
import { listHorizonSlates, horizonReadyCount } from "@/lib/question-slate-store";
import { formatWobble } from "@/lib/stack";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const serviceDay = serviceDayInZone(BEARGO_DAY_ZONE);
  const slateDate = networkSlateDate();
  const [
    hosts,
    paws,
    merchants,
    promotions,
    fees,
    playerRows,
    days,
    spread,
    scans,
    night,
    rows,
  ] = await Promise.all([
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
    scanSourcesTonight(),
    networkNightStats(serviceDay),
    adminHostRows(),
  ]);
  const weekReady = horizonReadyCount(days);
  const tonight = days[0];
  const slateLive =
    tonight?.status === "published" && isFullNightSlate(tonight.questions);

  return (
    <AdminShell current="/admin/overview">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        Tables {serviceDay}
        {slateDate !== serviceDay ? ` · questions ${slateDate}` : ""}
      </p>
      <h1 className="mt-2 font-display text-4xl">Network</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Tables sit until 6am Chicago. Questions flip at midnight. Scan sits a
        table. The Table Test, then the tray. A live chat is open after, under
        a bar name. Sponsorships are off.
      </p>

      <h2 className="mt-10 font-display text-2xl">Tonight</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Tables tonight"
          value={String(night.tables)}
          note={`${night.people} people sitting`}
        />
        <Stat label="Finished the test" value={String(night.finishedTest)} />
        <Stat label="Finished the tray" value={String(night.finishedTray)} />
        <Stat label="In the room" value={String(night.inRoom)} />
        <Stat
          label="At the bar"
          value={String(scans.inBar)}
          note="In-bar devices, last 4 hours"
        />
        <Stat
          label="From a share"
          value={String(scans.share)}
          note="Share-link devices, last 4 hours"
        />
        <Stat
          label="Best wobble"
          value={
            night.bestWobble == null ? "—" : formatWobble(night.bestWobble)
          }
        />
        <Stat
          label="Tables all-time"
          value={String(night.tablesAllTime)}
        />
        <Stat
          label="Table Spread (5 min)"
          value={spread.spread5m == null ? "—" : spread.spread5m.toFixed(2)}
          note={`This service night · ${spread.followOn5m} follow-on of ${spread.starts} GO · ${spread.followOn2m} in 2m · ${spread.followOn10m} in 10m`}
        />
        <Stat
          label="Next 7 days"
          value={`${weekReady}/7`}
          note={
            slateLive
              ? `${slateDate} slate is live (21)`
              : `${slateDate} needs a published 21`
          }
        />
        <Stat label="Hosts" value={String(hosts.length)} />
        <Stat label="Paws" value={String(paws.length)} />
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        <Link href="/admin/challenges" className="underline-offset-2 hover:underline">
          Generate and publish tonight’s 21
        </Link>
      </p>

      <h2 className="mt-10 font-display text-2xl">Hosts tonight</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Tables</th>
              <th className="pb-3 font-normal">People</th>
              <th className="pb-3 font-normal">Test</th>
              <th className="pb-3 font-normal">Tray</th>
              <th className="pb-3 font-normal">Room</th>
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
                <td>{row.night.tables}</td>
                <td>{row.night.people}</td>
                <td>{row.night.finishedTest}</td>
                <td>{row.night.finishedTray}</td>
                <td>{row.night.inRoom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-2xl">Paused local offers</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Not the live product. Player offers are off. Figures below are leftover
        merchant records, not table-night revenue.
      </p>
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
    </AdminShell>
  );
}

import { AdminShell, Stat } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listHosts, listPaws } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { listMerchants, listPromotions } from "@/lib/promotions";
import { listPlayers } from "@/lib/players";
import { listPlays } from "@/lib/store";
import { localDateInZone } from "@/lib/dates";
import { dollarsFromCents } from "@/lib/money";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [plays, hosts, paws, merchants, promotions, fees, playerRows] =
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
  ]);
  const today = localDateInZone("America/Chicago");
  const gamesToday = plays.filter((play) => play.localDate === today).length;

  return (
    <AdminShell current="/admin/overview">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">{today}</p>
      <h1 className="mt-2 font-display text-4xl">Network</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Game first. One nearby offer after rank. BearGo earns $1 only on a
        merchant-confirmed redemption.
      </p>
      <h2 className="mt-10 font-display text-2xl">Game</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Games today" value={String(gamesToday)} />
        <Stat label="Games all-time" value={String(plays.length)} />
        <Stat label="Hosts" value={String(hosts.length)} />
        <Stat label="Paws" value={String(paws.length)} />
      </div>
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

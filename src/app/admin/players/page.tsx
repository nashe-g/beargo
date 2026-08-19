import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { formatStamp } from "@/lib/format";
import { listPlayers, playerClaimCount } from "@/lib/players";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  await requireAdmin();
  const players = await listPlayers();
  const counts = Object.fromEntries(
    await Promise.all(
      players.map(async (player) => [player.id, await playerClaimCount(player.id)]),
    ),
  ) as Record<string, number>;

  return (
    <AdminShell current="/admin/players">
      <h1 className="font-display text-4xl">Players</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Contact collected when someone claims an offer. Not shared as a merchant
        lead. Email must be verified before a voucher is issued.
      </p>
      {players.length === 0 ? (
        <p className="mt-8 text-ink-soft">None yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="pb-3 font-normal">Name</th>
                <th className="pb-3 font-normal">Email</th>
                <th className="pb-3 font-normal">Phone</th>
                <th className="pb-3 font-normal">Verified</th>
                <th className="pb-3 font-normal">Vouchers</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-t border-ink/10">
                  <td className="py-3">{player.fullName}</td>
                  <td>{player.email}</td>
                  <td>{player.phone}</td>
                  <td>
                    {player.emailVerifiedAt ? (
                      <StatusPill status="verified" />
                    ) : (
                      <StatusPill status="pending_verification" />
                    )}
                  </td>
                  <td>
                    {counts[player.id] ?? 0}
                    {player.emailVerifiedAt ? (
                      <span className="ml-2 text-ink-soft">
                        {formatStamp(player.emailVerifiedAt, "America/Chicago")}
                      </span>
                    ) : null}
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

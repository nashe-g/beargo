import { HostShell } from "@/components/host/HostShell";
import { formatMoney } from "@/lib/format";
import { requireHost } from "@/lib/host-auth";
import { hostEarningsLedger } from "@/lib/host-stats";

export const dynamic = "force-dynamic";

export default async function HostEarningsPage() {
  const host = await requireHost();
  const ledger = await hostEarningsLedger(host);

  return (
    <HostShell host={host} current="/host/earnings">
      <h1 className="font-display text-4xl">Potential earnings</h1>
      <p className="mt-3 text-ink-soft">
        Host share on qualified introductions. Potential until a payout is
        marked. Not a tip, and not live rates yet.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Money label="Potential" value={ledger.potential} />
        <Money label="Pending payout" value={ledger.pending} />
        <Money label="Paid" value={ledger.paid} />
      </div>

      <h2 className="mt-10 font-display text-2xl">Ledger</h2>
      {ledger.rows.length === 0 ? (
        <p className="mt-4 text-ink-soft">No introductions yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 rounded-3xl border border-ink/10">
          {ledger.rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p>{row.source}</p>
                <p className="text-sm text-ink-soft">
                  {new Date(row.at).toLocaleString("en-US", {
                    timeZone: host.timezone,
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {row.status}
                </p>
              </div>
              <p className="font-display text-xl">{formatMoney(row.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </HostShell>
  );
}

function Money({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-ink px-5 py-6 text-paper">
      <p className="text-sm text-paper/55">{label}</p>
      <p className="mt-1 font-display text-3xl">{formatMoney(value)}</p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { AdminShell, Stat, StatusPill } from "@/components/admin/AdminShell";
import { HostLoginForm } from "@/components/admin/HostLoginForm";
import { NearbyOfferCards } from "@/components/offers/NearbyOfferCards";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { emailsForHost } from "@/lib/auth";
import { getHost } from "@/lib/hosts";
import { isFullNightSlate } from "@/lib/question-packs";
import { formatWobble } from "@/lib/stack";
import { tableStatusLabel } from "@/lib/table-copy";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHostPage({
  params,
}: PageProps<"/admin/hosts/[hostId]">) {
  await requireAdmin();
  const { hostId } = await params;
  const host = await getHost(hostId);
  if (!host) notFound();

  const row = (await adminHostRows()).find((entry) => entry.host.id === host.id);
  if (!row) notFound();
  const loginEmails = await emailsForHost(host.id);
  const slateLive = isFullNightSlate(row.challenge.questions);

  return (
    <AdminShell current="/admin/hosts">
      <h1 className="font-display text-4xl">{host.displayName}</h1>
      <p className="mt-3 text-ink-soft">
        {[host.address, host.neighborhood, host.city].filter(Boolean).join(" · ") ||
          "No street address yet."}{" "}
        {host.timezone}.
      </p>

      <section className="mt-8 max-w-xl">
        <h2 className="font-display text-2xl">Host login</h2>
        <p className="mt-2 text-ink-soft">
          They only get mail if they request a sign-in link. Add this when you
          onboard them.
        </p>
        <HostLoginForm hostId={host.id} emails={loginEmails} />
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tables tonight" value={String(row.night.tables)} />
        <Stat label="People" value={String(row.night.people)} />
        <Stat label="Finished the test" value={String(row.night.finishedTest)} />
        <Stat
          label="Best wobble"
          value={
            row.night.bestWobble == null
              ? "—"
              : formatWobble(row.night.bestWobble)
          }
        />
        <Stat label="Paws" value={String(row.paws.length)} />
        <Stat
          label="Coords"
          value={
            host.lat != null && host.lng != null
              ? `${host.lat.toFixed(4)}, ${host.lng.toFixed(4)}`
              : "Missing"
          }
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Tonight’s tables</h2>
        <p className="mt-2 text-ink-soft">
          Service night {row.night.serviceDay}. Join codes are for phones at
          the table, not the Paw QR.
        </p>
        {row.night.rows.length === 0 ? (
          <p className="mt-4 text-ink-soft">Nobody sitting yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="pb-3 font-normal">Table</th>
                  <th className="pb-3 font-normal">Code</th>
                  <th className="pb-3 font-normal">People</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 font-normal">Test</th>
                  <th className="pb-3 font-normal">Tonight</th>
                  <th className="pb-3 font-normal">Wobble</th>
                </tr>
              </thead>
              <tbody>
                {row.night.rows.map((table) => (
                  <tr key={table.joinCode} className="border-t border-ink/10">
                    <td className="py-3">{table.name}</td>
                    <td className="py-3 font-mono">{table.joinCode}</td>
                    <td>{table.people}</td>
                    <td className="py-3">
                      <StatusPill status={table.status} />
                      <span className="ml-2 text-ink-soft">
                        {tableStatusLabel(table.status)}
                      </span>
                    </td>
                    <td>
                      {table.round1Rank != null ? `#${table.round1Rank}` : "—"}
                    </td>
                    <td>
                      {table.combinedRank != null ? `#${table.combinedRank}` : "—"}
                    </td>
                    <td>
                      {table.skipped
                        ? "skip"
                        : table.wobble == null
                          ? "—"
                          : formatWobble(table.wobble)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Tonight’s 21</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          {row.challenge.localDate} · network ·{" "}
          {slateLive
            ? `${row.challenge.questions.length} published`
            : "not published yet"}
          .{" "}
          <Link href="/admin/challenges" className="underline-offset-2 hover:underline">
            Edit on Challenges
          </Link>
        </p>
        {slateLive ? (
          <div className="mt-4 space-y-6">
            {Array.from({ length: Math.ceil(row.challenge.questions.length / 3) }, (_, pack) => (
              <div key={pack}>
                <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                  Pack {pack + 1} of 7
                </p>
                <ol className="mt-3 grid gap-4 lg:grid-cols-3">
                  {row.challenge.questions
                    .slice(pack * 3, pack * 3 + 3)
                    .map((question) => (
                      <li
                        key={question.id}
                        className="rounded-3xl border border-ink/10 px-5 py-4"
                      >
                        <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                          {question.difficulty}
                        </p>
                        <p className="mt-2">{question.prompt}</p>
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Nearby offers</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Player offers are off. These still exist for merchants; nobody at
          the table sees them.
        </p>
        <NearbyOfferCards
          nearby={row.nearby}
          blockedIds={host.excludedPromotionIds}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Paws</h2>
        {row.paws.length === 0 ? (
          <p className="mt-4 text-ink-soft">None assigned.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {row.paws.map((paw) => (
              <li
                key={paw.token}
                className="flex items-center justify-between rounded-2xl bg-paper-deep px-4 py-3"
              >
                <span>
                  {paw.token} · {paw.placementLabel}
                </span>
                <span className="flex items-center gap-3">
                  <a href={`/p/${paw.token}/print`} className="underline-offset-2 hover:underline">
                    Print QR
                  </a>
                  <StatusPill status={paw.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

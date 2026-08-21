import { notFound } from "next/navigation";
import { AdminShell, Stat, StatusPill } from "@/components/admin/AdminShell";
import { NearbyOfferCards } from "@/components/offers/NearbyOfferCards";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { getHost } from "@/lib/hosts";
import { listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHostPage({
  params,
}: PageProps<"/admin/hosts/[hostId]">) {
  await requireAdmin();
  const { hostId } = await params;
  const host = await getHost(hostId);
  if (!host) notFound();

  const plays = await listPlays();
  const row = (await adminHostRows(plays)).find(
    (entry) => entry.host.id === host.id,
  );
  if (!row) notFound();

  return (
    <AdminShell current="/admin/hosts">
      <h1 className="font-display text-4xl">{host.displayName}</h1>
      <p className="mt-3 text-ink-soft">
        {[host.address, host.neighborhood, host.city].filter(Boolean).join(" · ") ||
          "No street address yet."}{" "}
        {host.timezone}.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Games today" value={String(row.today.gamesFinished)} />
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
        <h2 className="font-display text-2xl">Nearby offers</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Players see one offer after they finish: the closest live offer this
          room allows. Blocked offers stay listed here.
        </p>
        <NearbyOfferCards
          nearby={row.nearby}
          blockedIds={host.excludedPromotionIds}
        />
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Today’s challenge</h2>
          <ol className="mt-4 space-y-4">
            {row.challenge.questions.map((question, index) => (
              <li key={question.id} className="rounded-3xl border border-ink/10 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                  {index + 1} · {question.difficulty}
                </p>
                <p className="mt-2">{question.prompt}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
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
        </div>
      </section>
    </AdminShell>
  );
}

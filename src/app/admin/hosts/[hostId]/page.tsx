import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, Stat, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { formatMoney } from "@/lib/format";
import { getHost } from "@/lib/hosts";
import { listLeads, listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHostPage({
  params,
}: PageProps<"/admin/hosts/[hostId]">) {
  await requireAdmin();
  const { hostId } = await params;
  const host = await getHost(hostId);
  if (!host) notFound();

  const [plays, leads] = await Promise.all([listPlays(), listLeads()]);
  const row = (await adminHostRows(plays, leads)).find(
    (entry) => entry.host.id === host.id,
  );
  if (!row) notFound();

  return (
    <AdminShell current="/admin/hosts">
      <h1 className="font-display text-4xl">{host.displayName}</h1>
      <p className="mt-3 text-ink-soft">
        {host.timezone}.{" "}
        {row.sponsor
          ? `Today’s sponsor is ${row.sponsor.name}.`
          : "No sponsor on the floor. The game still runs."}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Games today" value={String(row.today.gamesFinished)} />
        <Stat label="Intros today" value={String(row.today.introductionsStarted)} />
        <Stat label="QLs today" value={String(row.today.qualifiedLeads)} />
        <Stat label="Potential today" value={formatMoney(row.today.earnings)} />
      </div>

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
                  <StatusPill status={paw.status} />
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-10 font-display text-2xl">Campaigns</h2>
          <ul className="mt-4 space-y-3">
            {row.campaigns.length === 0 ? (
              <li className="text-ink-soft">None assigned.</li>
            ) : (
              row.campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="flex items-center justify-between rounded-2xl border border-ink/10 px-4 py-3"
                  >
                    <span>{campaign.name}</span>
                    <StatusPill status={campaign.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </AdminShell>
  );
}

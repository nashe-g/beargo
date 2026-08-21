import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  await requireAdmin();
  const plays = await listPlays();
  const rows = await adminHostRows(plays);

  return (
    <AdminShell current="/admin/challenges">
      <h1 className="font-display text-4xl">Challenges</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Same three questions for every player at that host today. Drawn from
        the reviewed pool. Generate drafts from Questions → Generate.
      </p>

      <div className="mt-8 space-y-8">
        {rows.map((row) => (
          <section
            key={row.host.id}
            className="rounded-3xl border border-ink/10 px-6 py-6"
          >
            <h2 className="font-display text-2xl">{row.host.displayName}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {row.challenge.localDate} · {row.challenge.id}
            </p>
            <ol className="mt-5 grid gap-4 lg:grid-cols-3">
              {row.challenge.questions.map((question, index) => (
                <li key={question.id}>
                  <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                    Q{index + 1} · {question.difficulty}
                  </p>
                  <p className="mt-2">{question.prompt}</p>
                  <p className="mt-2 text-sm text-moss">
                    {question.choices.find(
                      (choice) => choice.id === question.correctId,
                    )?.label}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}

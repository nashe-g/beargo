import { AdminShell } from "@/components/admin/AdminShell";
import { WeekSlateEditor } from "@/components/admin/WeekSlateEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { llmConfigured } from "@/lib/question-generate";
import { isFullNightSlate } from "@/lib/question-packs";
import {
  horizonReadyCount,
  listHorizonSlates,
} from "@/lib/question-slate-store";
import { listPlays } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  await requireAdmin();
  const [plays, days] = await Promise.all([listPlays(), listHorizonSlates()]);
  const rows = await adminHostRows(plays);
  const ready = horizonReadyCount(days);
  const tonight = days[0];
  const networkLive =
    tonight?.status === "published" && isFullNightSlate(tonight.questions);

  return (
    <AdminShell current="/admin/challenges">
      <h1 className="font-display text-4xl">Challenges</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Each night is 21 questions. Generate the next two empty days, edit,
        then publish. Same slate at every host.
      </p>
      <p className="mt-4 text-sm text-ink-soft">
        Next 7 days: {ready}/7 published
        {networkLive ? " · today’s network slate is live" : ""}.
      </p>

      <div className="mt-8">
        <WeekSlateEditor days={days} configured={llmConfigured()} />
      </div>

      <h2 className="mt-16 font-display text-3xl">Today by host</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {networkLive
          ? "A published 21-question slate is live, so every host below should match."
          : "No 21-question night published for today yet. Generate the next two days, then publish."}
      </p>

      <div className="mt-8 space-y-8">
        {rows.map((row) => (
          <section
            key={row.host.id}
            className="rounded-3xl border border-ink/10 px-6 py-6"
          >
            <h2 className="font-display text-2xl">{row.host.displayName}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {row.challenge.localDate} · network · {row.challenge.questions.length}{" "}
              questions
            </p>
            <ol className="mt-5 grid gap-4 lg:grid-cols-3">
              {row.challenge.questions.map((question, index) => (
                <li key={question.id}>
                  <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                    Pack {Math.floor(index / 3) + 1} · Q{(index % 3) + 1} ·{" "}
                    {question.difficulty}
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

import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { QUESTION_POOL } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  await requireAdmin();
  const easy = QUESTION_POOL.filter((question) => question.difficulty === "easy");
  const medium = QUESTION_POOL.filter(
    (question) => question.difficulty === "medium",
  );
  const hard = QUESTION_POOL.filter((question) => question.difficulty === "hard");

  return (
    <AdminShell current="/admin/questions">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Questions</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Hand-built pool. Daily picker takes one easy, one medium, one
            hard per host. Generation and format validation land later.
          </p>
        </div>
        <Link
          href="/admin/questions/generate"
          className="flex h-12 items-center rounded-full border border-ink/20 px-5"
        >
          Generation (later)
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Count label="Easy" value={easy.length} />
        <Count label="Medium" value={medium.length} />
        <Count label="Hard" value={hard.length} />
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">ID</th>
              <th className="pb-3 font-normal">Difficulty</th>
              <th className="pb-3 font-normal">Prompt</th>
              <th className="pb-3 font-normal">Correct</th>
            </tr>
          </thead>
          <tbody>
            {QUESTION_POOL.map((question) => (
              <tr key={question.id} className="border-t border-ink/10">
                <td className="py-3 font-mono text-xs">{question.id}</td>
                <td>
                  <StatusPill status={question.difficulty} />
                </td>
                <td className="max-w-md">{question.prompt}</td>
                <td>
                  {
                    question.choices.find(
                      (choice) => choice.id === question.correctId,
                    )?.label
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-ink/10 px-5 py-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { GenerateQuestions } from "@/components/admin/GenerateQuestions";
import { requireAdmin } from "@/lib/admin-auth";
import { llmConfigured } from "@/lib/question-generate";
import { listCandidates } from "@/lib/questions-pipeline";

export const dynamic = "force-dynamic";

export default async function AdminQuestionGeneratePage() {
  await requireAdmin();
  const candidates = await listCandidates();
  return (
    <AdminShell current="/admin/questions">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Generate questions</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            LLM drafts, format validation, then your approval. The daily picker
            only uses the approved pool.
          </p>
        </div>
        <Link
          href="/admin/questions"
          className="flex h-12 items-center rounded-full border border-ink/20 px-5"
        >
          Live pool
        </Link>
      </div>
      <div className="mt-8">
        <GenerateQuestions
          configured={llmConfigured()}
          candidates={candidates}
        />
      </div>
    </AdminShell>
  );
}

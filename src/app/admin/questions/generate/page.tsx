import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminQuestionGeneratePage() {
  await requireAdmin();
  return (
    <AdminShell current="/admin/questions">
      <h1 className="font-display text-4xl">Question generation</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-soft">
        Not wired. This is where an LLM draft will land, then format
        validation, then human review, then the daily picker.
      </p>
      <p className="mt-6 text-ink-soft">
        Until then the live game draws from the hand-built pool on Questions.
      </p>
    </AdminShell>
  );
}

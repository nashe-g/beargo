import { AdminShell } from "@/components/admin/AdminShell";
import { ExperienceWeekBuilder } from "@/components/admin/ExperienceWeekBuilder";
import { requireAdmin } from "@/lib/admin-auth";
import { loadInspirationLibrary } from "@/lib/inspiration-library";
import { llmConfigured } from "@/lib/question-generate";

export const dynamic = "force-dynamic";

export default async function NewExperienceWeekPage() {
  await requireAdmin();
  return (
    <AdminShell current="/admin/experiences">
      <h1 className="font-display text-4xl">Plant a week</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Pick or paste 7 seeds. Generate drafts. Edit. Publish. Day 1 is live
        everywhere immediately.
      </p>
      <div className="mt-8">
        <ExperienceWeekBuilder
          library={JSON.parse(
            JSON.stringify(loadInspirationLibrary()),
          ) as ReturnType<typeof loadInspirationLibrary>}
          configured={llmConfigured()}
        />
      </div>
    </AdminShell>
  );
}

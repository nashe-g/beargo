import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { ExperienceEditor } from "@/components/admin/ExperienceEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { getExperience } from "@/lib/experience-store";
import { getInspirationSeed } from "@/lib/inspiration-library";
import { llmConfigured } from "@/lib/question-generate";

export const dynamic = "force-dynamic";

export default async function ExperienceEditPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await requireAdmin();
  const { experienceId } = await params;
  const experience = await getExperience(experienceId);
  if (!experience) notFound();
  const seed = getInspirationSeed(experience.seedId);

  return (
    <AdminShell current="/admin/experiences">
      <Link
        href="/admin/experiences/new"
        className="text-sm text-ink-soft underline-offset-2 hover:underline"
      >
        ← Back to this week
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
            {experience.format} · {experience.adaptationMode.replace("_", " ")}
          </p>
          <h1 className="mt-2 font-display text-4xl">
            {experience.title || experience.seedId}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Generate a draft first, then use Preview on phone. Your week tray
            is saved in this browser until you publish or clear it.
          </p>
        </div>
        <StatusPill status={experience.status} />
      </div>
      <div className="mt-8">
        <ExperienceEditor
          experience={JSON.parse(JSON.stringify(experience)) as typeof experience}
          seed={seed}
          configured={llmConfigured()}
        />
      </div>
    </AdminShell>
  );
}

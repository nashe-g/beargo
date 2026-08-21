import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import { listRecentExperiences, listSchedule } from "@/lib/experience-store";
import { llmConfigured } from "@/lib/question-generate";

export const dynamic = "force-dynamic";

export default async function AdminExperiencesPage() {
  await requireAdmin();
  const today = localDateInZone(BEARGO_DAY_ZONE);
  const [schedule, recent] = await Promise.all([
    listSchedule(today, 14),
    listRecentExperiences(12),
  ]);
  const configured = llmConfigured();

  return (
    <AdminShell current="/admin/experiences">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Experiences</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            One BearGo a day, everywhere. Plant a week from the 365 library.
            Day one goes live on publish. Text only — no photos, logos, or
            screenshots. The paw plays whatever format you scheduled. Empty days
            still fall back to trivia from the{" "}
            <Link href="/admin/questions" className="underline-offset-2 hover:underline">
              approved pool
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/experiences/new"
          className="flex h-12 items-center rounded-full bg-ink px-5 text-paper"
        >
          Plant a week
        </Link>
      </div>

      {!configured ? (
        <p className="mt-6 text-clay">
          No OPENAI_API_KEY. You can still pick seeds and paste JSON; generate
          needs the key.
        </p>
      ) : null}

      <h2 className="mt-10 font-display text-2xl">Schedule</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Date</th>
              <th className="pb-3 font-normal">Title</th>
              <th className="pb-3 font-normal">Format</th>
              <th className="pb-3 font-normal">On the paw</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.localDate} className="border-t border-ink/10">
                <td className="py-3 font-mono text-xs">
                  {row.localDate}
                  {row.localDate === today ? " · today" : ""}
                </td>
                <td>
                  {row.experience ? (
                    <Link
                      href={`/admin/experiences/${row.experience.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.experience.title || row.experience.seedId}
                    </Link>
                  ) : (
                    <span className="text-ink-soft">Pool trivia</span>
                  )}
                </td>
                <td>{row.experience?.format ?? "—"}</td>
                <td>
                  {row.experience ? "Live format" : "Pool trivia"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 font-display text-2xl">Recent drafts</h2>
      {recent.length === 0 ? (
        <p className="mt-4 text-ink-soft">Nothing planted yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink/10 px-5 py-4"
            >
              <div>
                <p className="font-display text-xl">
                  {row.title || row.seedId}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {row.seedId} · {row.format} · {row.adaptationMode.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={row.status} />
                <Link
                  href={`/admin/experiences/${row.id}`}
                  className="text-sm underline-offset-2 hover:underline"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

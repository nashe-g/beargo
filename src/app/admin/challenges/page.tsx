import { AdminShell } from "@/components/admin/AdminShell";
import { WeekSlateEditor } from "@/components/admin/WeekSlateEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { adminHostRows } from "@/lib/admin-stats";
import { networkSlateDate } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { llmConfigured } from "@/lib/question-generate";
import { isFullNightSlate } from "@/lib/question-packs";
import {
  horizonReadyCount,
  listHorizonSlates,
} from "@/lib/question-slate-store";
import { listQuestionReports } from "@/lib/questions-pipeline";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  await requireAdmin();
  const serviceDay = serviceDayInZone(BEARGO_DAY_ZONE);
  const slateDate = networkSlateDate();
  const [days, rows, reports] = await Promise.all([
    listHorizonSlates(),
    adminHostRows(),
    listQuestionReports(),
  ]);
  const ready = horizonReadyCount(days);
  const tonight = days[0];
  const networkLive =
    tonight?.status === "published" && isFullNightSlate(tonight.questions);

  return (
    <AdminShell current="/admin/challenges">
      <h1 className="font-display text-4xl">Challenges</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Each night is 21 questions. Generate the next two empty days, edit,
        then publish. Same slate at every host. Questions follow the Chicago
        calendar date ({slateDate}
        {slateDate !== serviceDay
          ? `; tables are still on service night ${serviceDay}`
          : ""}
        ).
      </p>
      <p className="mt-4 text-sm text-ink-soft">
        Next 7 days: {ready}/7 published
        {networkLive
          ? " · today’s network slate is live"
          : " · today’s 21 are not published yet"}
        .
      </p>

      <div className="mt-8">
        <WeekSlateEditor days={days} configured={llmConfigured()} />
      </div>

      <h2 className="mt-16 font-display text-3xl">Tonight by host</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {networkLive
          ? "A published 21-question slate is live at every host."
          : "No 21-question night published for the calendar date yet. Generate the next two days, then publish."}
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Tables</th>
              <th className="pb-3 font-normal">People</th>
              <th className="pb-3 font-normal">Test</th>
              <th className="pb-3 font-normal">Tray</th>
              <th className="pb-3 font-normal">Slate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.host.id} className="border-t border-ink/10">
                <td className="py-3">{row.host.displayName}</td>
                <td>{row.night.tables}</td>
                <td>{row.night.people}</td>
                <td>{row.night.finishedTest}</td>
                <td>{row.night.finishedTray}</td>
                <td>
                  {isFullNightSlate(row.challenge.questions)
                    ? `${row.challenge.questions.length} live`
                    : "Waiting"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 font-display text-3xl">Question reports</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Players can flag a question during The Table Test. These do not take
        it off tonight’s board.
      </p>
      {reports.length === 0 ? (
        <p className="mt-4 text-ink-soft">None yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="pb-3 font-normal">When</th>
                <th className="pb-3 font-normal">Paw</th>
                <th className="pb-3 font-normal">Question</th>
                <th className="pb-3 font-normal">Reason</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-ink/10 align-top">
                  <td className="py-3 font-mono text-xs text-ink-soft">
                    {report.createdAt.replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="py-3">{report.pawToken || "—"}</td>
                  <td className="max-w-md py-3">
                    {report.prompt || report.questionId}
                  </td>
                  <td className="py-3 text-ink-soft">{report.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

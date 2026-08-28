import { CANONICAL_ORIGIN } from "@/lib/config";
import { sendMail } from "@/lib/mail";
import type { DaySlate } from "@/lib/question-slate-store";

function adminInbox() {
  return process.env.ADMIN_NOTIFY_EMAIL ?? "admin@beargo.pro";
}

function siteOrigin() {
  return (process.env.MAIL_LINK_ORIGIN || CANONICAL_ORIGIN).replace(/\/$/, "");
}

export async function emailAdminWeekReminder(days: DaySlate[]) {
  const start = days[0]?.label ?? "this week";
  const end = days[days.length - 1]?.label ?? "";
  const url = `${siteOrigin()}/admin/challenges`;
  const lines = days.map((day) => {
    const state =
      day.status === "published"
        ? "published"
        : day.status === "draft"
          ? "draft — still needs publishing"
          : "empty";
    return `- ${day.label} (${day.localDate}): ${state}`;
  });
  const text = `Thursday reminder: generate and publish BearGo questions for ${start} through ${end}.

${lines.join("\n")}

Open the week calendar:
${url}`;
  return sendMail({
    to: adminInbox(),
    subject: `Generate next week’s BearGo questions (${start}–${end})`,
    text,
    html: `<p>Thursday reminder: generate and publish BearGo questions for <strong>${start}</strong> through <strong>${end}</strong>.</p><ul>${days
      .map(
        (day) =>
          `<li>${day.label} (${day.localDate}): ${
            day.status === "published"
              ? "published"
              : day.status === "draft"
                ? "draft — still needs publishing"
                : "empty"
          }</li>`,
      )
      .join("")}</ul><p><a href="${url}">Open the week calendar</a></p>`,
  });
}

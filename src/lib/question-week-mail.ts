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
  const start = days[0]?.label ?? "tonight";
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
  const text = `BearGo nights need 21 questions. Generate the next two empty days, then publish.

${lines.join("\n")}

Open the calendar:
${url}`;
  return sendMail({
    to: adminInbox(),
    subject: `BearGo questions: next nights from ${start}`,
    text,
    html: `<p>BearGo nights need 21 questions. Generate the next two empty days, then publish.</p><ul>${days
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
      .join("")}</ul><p><a href="${url}">Open the calendar</a></p>`,
  });
}

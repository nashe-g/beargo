import { NextResponse } from "next/server";
import { SLATE_GENERATE_DAYS } from "@/lib/config";
import { isFullNightSlate } from "@/lib/question-packs";
import { listHorizonSlates } from "@/lib/question-slate-store";
import { emailAdminWeekReminder } from "@/lib/question-week-mail";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret) return auth === `Bearer ${secret}`;
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = await listHorizonSlates();
  const upcoming = days.slice(0, SLATE_GENERATE_DAYS);
  const needsWork = upcoming.some(
    (day) => !(day.status === "published" && isFullNightSlate(day.questions)),
  );
  if (!needsWork) {
    return NextResponse.json({ ok: true, sent: false, reason: "ahead_published" });
  }

  const mailed = await emailAdminWeekReminder(days);
  return NextResponse.json({
    ok: true,
    sent: mailed.ok,
    mode: mailed.mode,
    dates: upcoming.map((day) => day.localDate),
  });
}

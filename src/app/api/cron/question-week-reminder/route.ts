import { NextResponse } from "next/server";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { weekdayLongInZone } from "@/lib/dates";
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

  if (weekdayLongInZone(BEARGO_DAY_ZONE) !== "Thursday") {
    return NextResponse.json({ ok: true, sent: false, reason: "not_thursday" });
  }

  const days = await listHorizonSlates();
  const needsWork = days.some((day) => day.status !== "published");
  if (!needsWork) {
    return NextResponse.json({ ok: true, sent: false, reason: "week_published" });
  }

  const mailed = await emailAdminWeekReminder(days);
  return NextResponse.json({
    ok: true,
    sent: mailed.ok,
    mode: mailed.mode,
    dates: days.map((day) => day.localDate),
  });
}

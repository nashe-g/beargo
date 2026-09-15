import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { clearCalendarSlates } from "@/lib/question-slate-store";

export async function POST() {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearCalendarSlates();
  await audit("admin", "questions.week.clear", {});
  return NextResponse.json({ ok: true });
}

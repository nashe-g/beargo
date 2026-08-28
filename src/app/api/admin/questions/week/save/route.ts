import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { saveDraftSlate } from "@/lib/question-slate-store";
import type { Question } from "@/lib/questions";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { localDate?: string; questions?: Question[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (!body.localDate || !Array.isArray(body.questions)) {
    return NextResponse.json({ error: "Missing day." }, { status: 400 });
  }

  const result = await saveDraftSlate(body.localDate, body.questions);
  if (!result.ok) {
    return NextResponse.json({ error: result.errors.join(" ") }, { status: 400 });
  }
  await audit("admin", "questions.week.save", { localDate: body.localDate });
  return NextResponse.json({ ok: true });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { SLATE_GENERATE_DAYS } from "@/lib/config";
import { generateWeekSlates, llmConfigured } from "@/lib/question-generate";
import {
  listHorizonSlates,
  nextEmptyDates,
} from "@/lib/question-slate-store";

export const maxDuration = 300;

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!llmConfigured()) {
    return NextResponse.json(
      { error: "No OPENAI_API_KEY. Add it to generate nights." },
      { status: 400 },
    );
  }

  let body: { note?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const days = await listHorizonSlates();
  const dates = nextEmptyDates(days, SLATE_GENERATE_DAYS);
  if (dates.length === 0) {
    return NextResponse.json({
      ok: true,
      created: [],
      failed: [],
      message: "No empty days in the next week. Publish drafts, or wait for a new day.",
    });
  }

  const result = await generateWeekSlates({
    dates,
    note: body.note,
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        created: result.created,
        failed: result.failed,
      },
      { status: 400 },
    );
  }
  await audit("admin", "questions.week.generate", {
    created: result.created,
    failed: result.failed,
    ahead: SLATE_GENERATE_DAYS,
  });
  return NextResponse.json(result);
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { generateWeekSlates, llmConfigured } from "@/lib/question-generate";
import { listHorizonSlates } from "@/lib/question-slate-store";

export const maxDuration = 300;

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!llmConfigured()) {
    return NextResponse.json(
      { error: "No OPENAI_API_KEY. Add it to generate the week." },
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
  const unpublished = days
    .filter((day) => day.status !== "published")
    .map((day) => day.localDate);
  if (unpublished.length === 0) {
    return NextResponse.json({
      ok: true,
      created: [],
      failed: [],
      message: "Next 7 days are already published.",
    });
  }

  const result = await generateWeekSlates({
    dates: unpublished,
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
  });
  return NextResponse.json(result);
}

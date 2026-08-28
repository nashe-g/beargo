import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { listHorizonSlates, publishDates } from "@/lib/question-slate-store";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { localDate?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const dates = body.localDate
    ? [body.localDate]
    : (await listHorizonSlates())
        .filter((day) => day.status === "draft")
        .map((day) => day.localDate);

  if (dates.length === 0) {
    return NextResponse.json({ error: "Nothing to publish." }, { status: 400 });
  }

  const result = await publishDates(dates);
  await audit("admin", "questions.week.publish", {
    published: result.published,
    failed: result.failed,
  });
  if (result.published.length === 0) {
    return NextResponse.json(
      {
        error: result.failed[0]?.errors.join(" ") ?? "Publish failed.",
        failed: result.failed,
      },
      { status: 400 },
    );
  }
  return NextResponse.json(result);
}

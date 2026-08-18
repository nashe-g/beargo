import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { approveCandidate, rejectCandidate } from "@/lib/questions-pipeline";

export async function POST(
  request: Request,
  context: { params: Promise<{ candidateId: string }> },
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { candidateId } = await context.params;
  let body: { action?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (body.action === "reject") {
    await rejectCandidate(candidateId);
    await audit("admin", "questions.reject", { candidateId });
    return NextResponse.json({ ok: true });
  }
  const result = await approveCandidate(candidateId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, errors: "errors" in result ? result.errors : [] },
      { status: 400 },
    );
  }
  await audit("admin", "questions.approve", { candidateId });
  return NextResponse.json({ ok: true });
}

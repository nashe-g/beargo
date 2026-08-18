import { getPaw } from "@/lib/paws";
import { reportQuestion } from "@/lib/questions-pipeline";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "report"), 8, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken } = await context.params;
  await getPaw(pawToken);
  let body: { questionId?: string; reason?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (!body.questionId) {
    return Response.json({ error: "Missing question" }, { status: 400 });
  }
  await reportQuestion({
    questionId: body.questionId,
    pawToken,
    reason: body.reason,
  });
  return Response.json({ ok: true });
}

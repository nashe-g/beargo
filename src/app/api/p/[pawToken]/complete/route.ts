import { cookies } from "next/headers";
import { playForPaw } from "@/lib/play-session";
import { resolvePayoff, type PlayAnswer } from "@/lib/play";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  stampSession,
} from "@/lib/scan-session";
import { recordPlay } from "@/lib/store";

const MAX_MS = 10 * 60 * 1000;

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/complete">,
) {
  if (!rateLimit(clientKey(request, "complete"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }

  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const jar = await cookies();
  const deviceKey = jar.get(DEVICE_COOKIE)?.value ?? null;
  const sessionId = jar.get(SCAN_COOKIE)?.value ?? null;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as { answers?: unknown };
  if (!Array.isArray(record.answers)) {
    return Response.json({ error: "Invalid answers" }, { status: 400 });
  }

  const answers: PlayAnswer[] = record.answers.map((entry) => {
    const row = entry as {
      interactionId?: unknown;
      questionId?: unknown;
      choiceIds?: unknown;
      choiceId?: unknown;
      text?: unknown;
      order?: unknown;
      responseMs?: unknown;
    };
    const choiceIds = Array.isArray(row.choiceIds)
      ? row.choiceIds.map((id) => String(id))
      : row.choiceId
        ? [String(row.choiceId)]
        : [];
    return {
      interactionId: String(row.interactionId ?? row.questionId ?? ""),
      choiceIds,
      text: row.text ? String(row.text) : undefined,
      order: Array.isArray(row.order) ? row.order.map((id) => String(id)) : undefined,
      responseMs: Number(row.responseMs),
    };
  });

  if (
    answers.some(
      (answer) =>
        !answer.interactionId ||
        !Number.isFinite(answer.responseMs) ||
        answer.responseMs < 0,
    )
  ) {
    return Response.json({ error: "Invalid answers" }, { status: 400 });
  }

  const play = await playForPaw(paw);
  const totalResponseMs = Math.round(
    answers.reduce((sum, answer) => sum + answer.responseMs, 0),
  );
  if (totalResponseMs > MAX_MS) {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }

  const payoff = resolvePayoff(play.body, answers);
  const recorded = await recordPlay({
    paw,
    challengeId: play.id,
    correctCount: payoff.correctCount,
    totalResponseMs,
    sessionId,
    deviceKey,
  });

  if (sessionId) {
    await stampSession(sessionId, "game_completed");
  }

  return Response.json({
    format: play.format,
    correctCount: recorded.correctCount,
    questionCount: payoff.questionCount,
    totalResponseMs: recorded.totalResponseMs,
    headline: payoff.headline,
    body: payoff.body,
    scoreLine: payoff.scoreLine,
  });
}

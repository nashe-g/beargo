import { challengeForPaw, scoreChallenge } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";
import { recordPlay } from "@/lib/store";

const MAX_MS = 10 * 60 * 1000;

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/complete">,
) {
  const { pawToken } = await context.params;
  const paw = getPaw(pawToken);

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

  const answers = record.answers.map((entry) => {
    const row = entry as {
      questionId?: unknown;
      choiceId?: unknown;
      responseMs?: unknown;
    };
    return {
      questionId: String(row.questionId ?? ""),
      choiceId: String(row.choiceId ?? ""),
      responseMs: Number(row.responseMs),
    };
  });

  const challenge = challengeForPaw(paw);
  const scored = scoreChallenge(challenge, answers);
  if (!scored || scored.totalResponseMs > MAX_MS) {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }

  const play = await recordPlay({
    paw,
    challengeId: scored.challengeId,
    correctCount: scored.correctCount,
    totalResponseMs: scored.totalResponseMs,
  });

  return Response.json({
    correctCount: play.correctCount,
    totalResponseMs: play.totalResponseMs,
    rank: play.rank,
    playerCount: play.playerCount,
    playersBeaten: play.playersBeaten,
  });
}

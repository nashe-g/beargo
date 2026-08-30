import { cookies } from "next/headers";
import { POUR_ENABLED, STACK_ENABLED } from "@/lib/config";
import { challengeForPaw, scoreChallenge } from "@/lib/daily-challenge";
import { localDateInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { scorePourRound } from "@/lib/pour";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  stampSession,
} from "@/lib/scan-session";
import { scoreStackRound } from "@/lib/stack";
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

  const record = body as {
    answers?: unknown;
    pourFills?: unknown;
    stackCarries?: unknown;
  };
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

  const challenge = await challengeForPaw(paw);
  const scored = scoreChallenge(challenge, answers);
  if (!scored || scored.totalResponseMs > MAX_MS) {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }

  let pourMg: number | null = null;
  let stackWobble: number | null = null;
  const date = localDateInZone(paw.timezone);
  if (POUR_ENABLED) {
    const poured = scorePourRound(date, paw.hostId, record.pourFills);
    if (!poured) {
      return Response.json({ error: "Invalid pour" }, { status: 400 });
    }
    pourMg = poured.pourMg;
  }
  if (STACK_ENABLED) {
    const stacked = scoreStackRound(date, paw.hostId, record.stackCarries);
    if (!stacked) {
      return Response.json({ error: "Invalid stack" }, { status: 400 });
    }
    stackWobble = stacked.stackWobble;
  }

  const play = await recordPlay({
    paw,
    challengeId: scored.challengeId,
    correctCount: scored.correctCount,
    totalResponseMs: scored.totalResponseMs,
    pourMg,
    stackWobble,
    sessionId,
    deviceKey,
  });

  if (sessionId) {
    await stampSession(sessionId, "game_completed");
  }

  return Response.json({
    correctCount: play.correctCount,
    totalResponseMs: play.totalResponseMs,
    pourMg: play.pourMg,
    stackWobble: play.stackWobble,
    rank: play.rank,
    playerCount: play.playerCount,
    playersBeaten: play.playersBeaten,
  });
}

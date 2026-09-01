import { cookies } from "next/headers";
import { STACK_ENABLED, TRIVIA_ENABLED } from "@/lib/config";
import { challengeForPaw, scoreChallenge } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  stampSession,
} from "@/lib/scan-session";
import { sanitizeBoardName } from "@/lib/board-name";
import { scoreStackRound, stackChallengeId } from "@/lib/stack";
import { rankedPlayForDevice, recordPlay, type RecordedPlay } from "@/lib/store";

function playPayload(play: RecordedPlay, alreadyPlayed: boolean) {
  return {
    stackWobble: play.stackWobble,
    correctCount: play.correctCount,
    totalResponseMs: play.totalResponseMs,
    boardName: play.boardName,
    rank: play.rank,
    playerCount: play.playerCount,
    playersBeaten: play.playersBeaten,
    topWobbles: play.topWobbles,
    topScores: play.topScores,
    neighbors: play.neighbors,
    alreadyPlayed,
  };
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/complete">,
) {
  if (!rateLimit(clientKey(request, "complete"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!STACK_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 400 });
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

  if (deviceKey && paw.token !== "demo") {
    const existing = await rankedPlayForDevice(paw, deviceKey);
    if (existing) {
      return Response.json(playPayload(existing, true));
    }
  }

  const record = body as {
    stackCarries?: unknown;
    answers?: unknown;
    boardName?: unknown;
  };
  const boardName = sanitizeBoardName(record.boardName);
  if (TRIVIA_ENABLED && !boardName) {
    return Response.json({ error: "Name the board" }, { status: 400 });
  }
  const serviceDay = serviceDayInZone(paw.timezone);
  const stacked = scoreStackRound(serviceDay, paw.hostId, record.stackCarries);
  if (!stacked) {
    return Response.json({ error: "Invalid stack" }, { status: 400 });
  }

  let correctCount = 0;
  let totalResponseMs = 0;
  if (TRIVIA_ENABLED) {
    if (!Array.isArray(record.answers)) {
      return Response.json({ error: "Invalid answers" }, { status: 400 });
    }
    const scored = scoreChallenge(
      await challengeForPaw(paw),
      record.answers as {
        questionId: string;
        choiceId: string;
        responseMs: number;
      }[],
    );
    if (!scored) {
      return Response.json({ error: "Invalid answers" }, { status: 400 });
    }
    correctCount = scored.correctCount;
    totalResponseMs = scored.totalResponseMs;
  }

  const play = await recordPlay({
    paw,
    challengeId: stackChallengeId(serviceDay),
    correctCount,
    totalResponseMs,
    stackWobble: stacked.stackWobble,
    boardName,
    sessionId,
    deviceKey,
  });

  if (sessionId) {
    await stampSession(sessionId, "game_completed");
  }

  return Response.json(playPayload(play, false));
}

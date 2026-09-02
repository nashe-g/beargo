import { cookies } from "next/headers";
import { STACK_ENABLED, TRIVIA_ENABLED } from "@/lib/config";
import { challengeForPaw, scoreChallenge } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { getOrCreateFeedIdentity } from "@/lib/feed-identity";
import { getPaw } from "@/lib/paws";
import { parsePlayKind } from "@/lib/play-kind";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  playSourceFromSession,
  stampSession,
} from "@/lib/scan-session";
import { ENTRY_COOKIE } from "@/lib/play-source";
import { sanitizeBoardName } from "@/lib/board-name";
import {
  DEMO_STACK_MODIFIER,
  scoreStackRound,
  stackChallengeId,
} from "@/lib/stack";
import {
  challengeIdForPlay,
  rankedPlayForDevice,
  recordPlay,
  type RecordedPlay,
} from "@/lib/store";

function playPayload(play: RecordedPlay, alreadyPlayed: boolean) {
  return {
    kind: play.kind,
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
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "complete"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }

  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const jar = await cookies();
  const deviceKey = jar.get(DEVICE_COOKIE)?.value ?? null;
  const sessionId = jar.get(SCAN_COOKIE)?.value ?? null;
  const playSource = await playSourceFromSession(
    sessionId,
    paw.token,
    jar.get(ENTRY_COOKIE)?.value,
  );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as {
    game?: unknown;
    stackCarries?: unknown;
    answers?: unknown;
    boardName?: unknown;
  };
  const kind = parsePlayKind(record.game);
  if (!kind) {
    return Response.json({ error: "Which game?" }, { status: 400 });
  }
  if (kind === "stack" && !STACK_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 400 });
  }
  if (kind === "trivia" && !TRIVIA_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 400 });
  }

  if (deviceKey && paw.token !== "demo") {
    const existing = await rankedPlayForDevice(paw, deviceKey, kind);
    if (existing) {
      return Response.json(playPayload(existing, true));
    }
  }

  const identity = await getOrCreateFeedIdentity();
  const boardName =
    sanitizeBoardName(record.boardName) || identity.publicHandle;
  const serviceDay = serviceDayInZone(paw.timezone);

  if (kind === "stack") {
    const stacked = scoreStackRound(
      serviceDay,
      paw.hostId,
      record.stackCarries,
      paw.token === "demo" ? DEMO_STACK_MODIFIER : undefined,
    );
    if (!stacked) {
      return Response.json({ error: "Invalid stack" }, { status: 400 });
    }
    const play = await recordPlay({
      paw,
      kind,
      challengeId: stackChallengeId(serviceDay),
      correctCount: 0,
      totalResponseMs: 0,
      stackWobble: stacked.stackWobble,
      boardName,
      sessionId,
      deviceKey,
      playSource,
    });
    if (sessionId) await stampSession(sessionId, "game_completed");
    return Response.json(playPayload(play, false));
  }

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
  const play = await recordPlay({
    paw,
    kind,
    challengeId: challengeIdForPlay(kind, serviceDay),
    correctCount: scored.correctCount,
    totalResponseMs: scored.totalResponseMs,
    boardName,
    sessionId,
    deviceKey,
    playSource,
  });
  if (sessionId) await stampSession(sessionId, "game_completed");
  return Response.json(playPayload(play, false));
}

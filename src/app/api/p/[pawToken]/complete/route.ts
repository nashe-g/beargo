import { cookies } from "next/headers";
import { STACK_ENABLED } from "@/lib/config";
import { serviceDayInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  DEVICE_COOKIE,
  SCAN_COOKIE,
  stampSession,
} from "@/lib/scan-session";
import { scoreStackRound, stackChallengeId } from "@/lib/stack";
import { rankedPlayForDevice, recordPlay, type RecordedPlay } from "@/lib/store";

function playPayload(play: RecordedPlay, alreadyPlayed: boolean) {
  return {
    stackWobble: play.stackWobble,
    rank: play.rank,
    playerCount: play.playerCount,
    playersBeaten: play.playersBeaten,
    topWobbles: play.topWobbles,
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

  // One ranked run per device per venue night. The demo paw stays open
  // so people can try it anywhere.
  if (deviceKey && paw.token !== "demo") {
    const existing = await rankedPlayForDevice(paw, deviceKey);
    if (existing) {
      return Response.json(playPayload(existing, true));
    }
  }

  const record = body as { stackCarries?: unknown };
  const serviceDay = serviceDayInZone(paw.timezone);
  const stacked = scoreStackRound(serviceDay, paw.hostId, record.stackCarries);
  if (!stacked) {
    return Response.json({ error: "Invalid stack" }, { status: 400 });
  }

  const play = await recordPlay({
    paw,
    challengeId: stackChallengeId(serviceDay),
    correctCount: 0,
    totalResponseMs: 0,
    stackWobble: stacked.stackWobble,
    sessionId,
    deviceKey,
  });

  if (sessionId) {
    await stampSession(sessionId, "game_completed");
  }

  return Response.json(playPayload(play, false));
}

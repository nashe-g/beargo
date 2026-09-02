import { GameResult } from "@/components/scanner/GameResult";
import { getPaw } from "@/lib/paws";
import { parsePlayKind } from "@/lib/play-kind";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { rankedPlayForDevice } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ pawToken: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pawToken } = await params;
  const query = await searchParams;
  const gameRaw = Array.isArray(query.game) ? query.game[0] : query.game;
  const kind = parsePlayKind(gameRaw) ?? "stack";
  const paw = await getPaw(pawToken);
  const deviceKey = await deviceKeyFromCookies();
  const played = deviceKey
    ? await rankedPlayForDevice(paw, deviceKey, kind)
    : null;
  return (
    <GameResult
      paw={paw}
      kind={kind}
      served={
        played
          ? {
              stackWobble: played.stackWobble ?? 0,
              correctCount: played.correctCount,
              totalResponseMs: played.totalResponseMs,
              boardName: played.boardName,
              rank: played.rank,
              playerCount: played.playerCount,
              playersBeaten: played.playersBeaten,
              topWobbles: played.topWobbles,
              neighbors: played.neighbors,
            }
          : null
      }
    />
  );
}

import { GameResult } from "@/components/scanner/GameResult";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { rankedPlayForDevice } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: PageProps<"/p/[pawToken]/result">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const deviceKey = await deviceKeyFromCookies();
  const played = deviceKey ? await rankedPlayForDevice(paw, deviceKey) : null;
  return (
    <GameResult
      paw={paw}
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

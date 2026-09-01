import { GameIntro } from "@/components/scanner/GameIntro";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { rankedPlayForDevice } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const fromRaw = Array.isArray(query.from) ? query.from[0] : query.from;
  const from = fromRaw ?? null;
  const paw = await getPaw(pawToken);
  const deviceKey = paw.token === "demo" ? null : await deviceKeyFromCookies();
  const played = deviceKey ? await rankedPlayForDevice(paw, deviceKey) : null;
  return (
    <GameIntro
      paw={paw}
      from={from}
      played={
        played
          ? {
              rank: played.rank,
              playerCount: played.playerCount,
              stackWobble: played.stackWobble ?? 0,
            }
          : null
      }
    />
  );
}

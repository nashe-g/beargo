import { GameIntro } from "@/components/scanner/GameIntro";
import { serviceDayInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { seedStackRound } from "@/lib/stack";
import { rankedPlayForDevice } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const seed = seedStackRound(serviceDayInZone(paw.timezone), paw.hostId);
  const deviceKey = paw.token === "demo" ? null : await deviceKeyFromCookies();
  const played = deviceKey ? await rankedPlayForDevice(paw, deviceKey) : null;
  return (
    <GameIntro
      paw={paw}
      modifier={seed.modifier}
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

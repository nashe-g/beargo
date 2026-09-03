import { NightHub } from "@/components/scanner/NightHub";
import { serviceDayInZone } from "@/lib/dates";
import { getFeedIdentityIfPresent } from "@/lib/feed-identity";
import { nightViewFor } from "@/lib/feed-night";
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
  const [stack, trivia, night, identity] = await Promise.all([
    deviceKey ? rankedPlayForDevice(paw, deviceKey, "stack") : null,
    deviceKey ? rankedPlayForDevice(paw, deviceKey, "trivia") : null,
    nightViewFor(paw),
    getFeedIdentityIfPresent(),
  ]);
  return (
    <NightHub
      paw={paw}
      from={from}
      serviceDay={serviceDayInZone(paw.timezone)}
      handle={identity?.publicHandle ?? null}
      peopleHere={night.peopleHere}
      pulse={night}
      stack={
        stack
          ? {
              kind: "stack",
              rank: stack.rank,
              playerCount: stack.playerCount,
              stackWobble: stack.stackWobble ?? 0,
              correctCount: stack.correctCount,
            }
          : null
      }
      trivia={
        trivia
          ? {
              kind: "trivia",
              rank: trivia.rank,
              playerCount: trivia.playerCount,
              stackWobble: trivia.stackWobble ?? 0,
              correctCount: trivia.correctCount,
            }
          : null
      }
    />
  );
}

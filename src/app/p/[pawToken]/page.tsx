import { NightHub } from "@/components/scanner/NightHub";
import { peopleHereTonight } from "@/lib/feed-presence";
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
  const [stack, trivia, peopleHere] = await Promise.all([
    deviceKey ? rankedPlayForDevice(paw, deviceKey, "stack") : null,
    deviceKey ? rankedPlayForDevice(paw, deviceKey, "trivia") : null,
    peopleHereTonight(paw),
  ]);
  return (
    <NightHub
      paw={paw}
      from={from}
      peopleHere={peopleHere}
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

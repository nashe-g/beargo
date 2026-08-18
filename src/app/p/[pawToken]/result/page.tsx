import { GameResult } from "@/components/scanner/GameResult";
import { challengeForPaw } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: PageProps<"/p/[pawToken]/result">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const challenge = await challengeForPaw(paw);
  return (
    <GameResult
      paw={paw}
      hasSponsor={Boolean(await todaysSponsor(paw))}
      questionIds={challenge.questions.map((question) => question.id)}
    />
  );
}

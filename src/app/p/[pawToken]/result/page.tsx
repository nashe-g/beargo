import { GameResult } from "@/components/scanner/GameResult";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export default async function ResultPage({
  params,
}: PageProps<"/p/[pawToken]/result">) {
  const { pawToken } = await params;
  const paw = getPaw(pawToken);
  return <GameResult paw={paw} hasSponsor={Boolean(todaysSponsor(paw))} />;
}

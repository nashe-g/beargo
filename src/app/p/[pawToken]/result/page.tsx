import { GameResult } from "@/components/scanner/GameResult";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: PageProps<"/p/[pawToken]/result">) {
  const { pawToken } = await params;
  return <GameResult paw={await getPaw(pawToken)} />;
}

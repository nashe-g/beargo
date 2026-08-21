import { GameIntro } from "@/components/scanner/GameIntro";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  return <GameIntro paw={await getPaw(pawToken)} />;
}

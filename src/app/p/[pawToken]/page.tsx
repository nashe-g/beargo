import { GameIntro } from "@/components/scanner/GameIntro";
import { getTodayPlay } from "@/lib/play-session";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  const play = await getTodayPlay();
  return (
    <GameIntro
      paw={await getPaw(pawToken)}
      title={play.body.title}
      hook={play.body.hook}
    />
  );
}

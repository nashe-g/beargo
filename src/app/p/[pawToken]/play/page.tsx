import { GamePlay } from "@/components/scanner/GamePlay";
import { playForPaw } from "@/lib/play-session";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  params,
}: PageProps<"/p/[pawToken]/play">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const session = await playForPaw(paw);
  return (
    <GamePlay
      paw={paw}
      session={JSON.parse(JSON.stringify(session)) as typeof session}
    />
  );
}

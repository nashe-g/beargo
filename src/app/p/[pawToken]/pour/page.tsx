import { PourPlay } from "@/components/scanner/PourPlay";
import { liveSkill } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { seedPourRound } from "@/lib/pour";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PourPage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  if (liveSkill() === "stack") redirect(`/p/${pawToken}/stack`);
  if (liveSkill() !== "pour") redirect(`/p/${pawToken}/play`);
  const paw = await getPaw(pawToken);
  const seed = seedPourRound(localDateInZone(paw.timezone), paw.hostId);
  return <PourPlay paw={paw} seed={seed} />;
}

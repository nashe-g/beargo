import { StackPlay } from "@/components/scanner/StackPlay";
import { liveSkill } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { seedStackRound } from "@/lib/stack";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StackPage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  if (liveSkill() !== "stack") redirect(`/p/${pawToken}/play`);
  const paw = await getPaw(pawToken);
  const seed = seedStackRound(localDateInZone(paw.timezone), paw.hostId);
  return <StackPlay paw={paw} seed={seed} />;
}

import { StackPlay } from "@/components/scanner/StackPlay";
import { STACK_ENABLED } from "@/lib/config";
import { serviceDayInZone } from "@/lib/dates";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { DEMO_STACK_MODIFIER, seedStackRound } from "@/lib/stack";
import { rankedPlayForDevice } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StackPage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  if (!STACK_ENABLED) redirect(`/p/${pawToken}`);
  const paw = await getPaw(pawToken);
  // One ranked run per device per venue night (the demo paw stays open).
  if (paw.token !== "demo") {
    const deviceKey = await deviceKeyFromCookies();
    if (deviceKey && (await rankedPlayForDevice(paw, deviceKey, "stack"))) {
      redirect(`/p/${pawToken}/result?game=stack`);
    }
  }
  const seed = seedStackRound(
    serviceDayInZone(paw.timezone),
    paw.hostId,
    paw.token === "demo" ? DEMO_STACK_MODIFIER : undefined,
  );
  return <StackPlay paw={paw} seed={seed} />;
}

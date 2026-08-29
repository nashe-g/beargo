import { redirect } from "next/navigation";
import { OfferReveal } from "@/components/scanner/OfferReveal";
import { PLAYER_OFFERS_ENABLED } from "@/lib/config";
import { getHost } from "@/lib/hosts";
import { getPaw } from "@/lib/paws";
import { getPlayer, playerIdFromCookies } from "@/lib/players";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { selectPromotionForHost } from "@/lib/select-promotion";

export const dynamic = "force-dynamic";

export default async function OfferPage({
  params,
}: PageProps<"/p/[pawToken]/offer">) {
  const { pawToken } = await params;
  if (!PLAYER_OFFERS_ENABLED) redirect(`/p/${pawToken}/result`);
  const paw = await getPaw(pawToken);
  const host = await getHost(paw.hostId);
  const selected = host
    ? await selectPromotionForHost(host, {
        deviceKey: await deviceKeyFromCookies(),
      })
    : null;
  if (!selected) redirect(`/p/${pawToken}/result`);
  const knownId = await playerIdFromCookies();
  const known = knownId ? await getPlayer(knownId) : null;
  return (
    <OfferReveal
      paw={paw}
      offer={selected.card}
      known={
        known
          ? { fullName: known.fullName, email: known.email, phone: known.phone }
          : null
      }
    />
  );
}

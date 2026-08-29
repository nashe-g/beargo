import { GameResult } from "@/components/scanner/GameResult";
import { selectAffiliateCard } from "@/lib/affiliate";
import { PLAYER_OFFERS_ENABLED } from "@/lib/config";
import { getHost } from "@/lib/hosts";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { selectPromotionForHost } from "@/lib/select-promotion";
import { activeVoucherForDevice } from "@/lib/vouchers";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: PageProps<"/p/[pawToken]/result">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  let affiliate = null;
  try {
    affiliate = await selectAffiliateCard({ hostId: paw.hostId });
  } catch {
    affiliate = null;
  }
  if (!PLAYER_OFFERS_ENABLED) {
    return (
      <GameResult
        paw={paw}
        offer={null}
        claimedHref={null}
        affiliate={affiliate}
      />
    );
  }
  const host = await getHost(paw.hostId);
  const deviceKey = await deviceKeyFromCookies();
  const claimed = deviceKey
    ? await activeVoucherForDevice(deviceKey, paw.hostId)
    : null;
  const selected =
    !claimed && host
      ? await selectPromotionForHost(host, { deviceKey })
      : null;
  return (
    <GameResult
      paw={paw}
      offer={selected?.card ?? null}
      claimedHref={
        claimed ? `/p/${pawToken}/voucher/${claimed.token}` : null
      }
      affiliate={affiliate}
    />
  );
}

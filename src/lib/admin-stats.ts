import { listHosts, pawsForHost } from "@/lib/catalog";
import { getDailyChallenge } from "@/lib/daily-challenge";
import { localDateInZone } from "@/lib/dates";
import { hostTodayStats } from "@/lib/host-stats";
import type { Play } from "@/lib/rank";
import { selectPromotionForHost } from "@/lib/select-promotion";

const NETWORK_ZONE = "America/Chicago";

export async function adminHostRows(plays: Play[]) {
  const hosts = await listHosts();
  return Promise.all(
    hosts.map(async (host) => ({
      host,
      today: hostTodayStats(host, plays),
      offer: await selectPromotionForHost(host),
      paws: await pawsForHost(host.id),
      challenge: await getDailyChallenge(host.id, host.timezone),
    })),
  );
}

export function networkDate() {
  return localDateInZone(NETWORK_ZONE);
}

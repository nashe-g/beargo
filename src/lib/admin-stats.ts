import { listHosts, pawsForHost } from "@/lib/catalog";
import { getTonightSlate } from "@/lib/daily-challenge";
import { localDateInZone } from "@/lib/dates";
import { hostTonight } from "@/lib/host-stats";
import { listNearbyOffersForHost } from "@/lib/select-promotion";

const NETWORK_ZONE = "America/Chicago";

export async function adminHostRows() {
  const hosts = await listHosts();
  return Promise.all(
    hosts.map(async (host) => ({
      host,
      night: await hostTonight(host),
      nearby: await listNearbyOffersForHost(host, { includeBlocked: true }),
      paws: await pawsForHost(host.id),
      challenge: await getTonightSlate(host.id, host.timezone),
    })),
  );
}

export function networkDate() {
  return localDateInZone(NETWORK_ZONE);
}

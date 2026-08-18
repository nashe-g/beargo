import { listCampaigns } from "@/lib/campaign-resolve";
import type { Campaign } from "@/lib/campaigns";
import { localDateInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import type { PawRecord } from "@/lib/paws";
import { hashSeed, mulberry32 } from "@/lib/rng";

export function eligibleCampaigns(hostId: string) {
  return listCampaigns().filter(
    (campaign) =>
      campaign.status === "live" &&
      campaign.eligibleHostIds.includes(hostId),
  );
}

export function todaysSponsorForHost(
  hostId: string,
  timezone: string,
  at = new Date(),
): Campaign | null {
  const candidates = eligibleCampaigns(hostId);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const localDate = localDateInZone(timezone, at);
  const random = mulberry32(hashSeed(`${hostId}:${localDate}:sponsor`));
  return candidates[Math.floor(random() * candidates.length)];
}

export function todaysSponsor(paw: PawRecord, at = new Date()) {
  return todaysSponsorForHost(paw.hostId, paw.timezone, at);
}

export function todaysSponsorForHostRecord(host: HostRecord, at = new Date()) {
  return todaysSponsorForHost(host.id, host.timezone, at);
}

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { listCampaigns } from "@/lib/catalog";
import type { Campaign } from "@/lib/campaigns";
import { localDateInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import type { PawRecord } from "@/lib/paws";
import { hashSeed, mulberry32 } from "@/lib/rng";

export async function campaignQualifiedCount(campaignId: string) {
  const [row] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.campaignId, campaignId), eq(leads.status, "qualified")));
  return row?.count ?? 0;
}

export function campaignIsRoutable(
  campaign: Campaign,
  hostId: string,
  qualifiedCount: number,
  at = new Date(),
) {
  if (campaign.status !== "live") return false;
  if (!campaign.eligibleHostIds.includes(hostId)) return false;
  if (campaign.fundedBalance < campaign.grossCpl) return false;
  if (campaign.maxLeads != null && qualifiedCount >= campaign.maxLeads) {
    return false;
  }
  if (campaign.startsAt && new Date(campaign.startsAt).getTime() > at.getTime()) {
    return false;
  }
  if (campaign.endsAt && new Date(campaign.endsAt).getTime() < at.getTime()) {
    return false;
  }
  return true;
}

export async function eligibleCampaigns(hostId: string, at = new Date()) {
  const campaigns = await listCampaigns();
  const counts = await Promise.all(
    campaigns.map(async (campaign) => ({
      campaign,
      qualifiedCount: await campaignQualifiedCount(campaign.id),
    })),
  );
  return counts
    .filter(({ campaign, qualifiedCount }) =>
      campaignIsRoutable(campaign, hostId, qualifiedCount, at),
    )
    .map(({ campaign }) => campaign);
}

export async function todaysSponsorForHost(
  hostId: string,
  timezone: string,
  at = new Date(),
): Promise<Campaign | null> {
  const candidates = await eligibleCampaigns(hostId, at);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const localDate = localDateInZone(timezone, at);
  const random = mulberry32(hashSeed(`${hostId}:${localDate}:sponsor`));
  return candidates[Math.floor(random() * candidates.length)];
}

export async function todaysSponsor(paw: PawRecord, at = new Date()) {
  return todaysSponsorForHost(paw.hostId, paw.timezone, at);
}

export async function todaysSponsorForHostRecord(
  host: HostRecord,
  at = new Date(),
) {
  return todaysSponsorForHost(host.id, host.timezone, at);
}

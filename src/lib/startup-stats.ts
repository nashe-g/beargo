import type { Campaign } from "@/lib/campaigns";
import { campaignsForStartup, getCampaign, getHost, getPaw } from "@/lib/catalog";
import { todaysSponsorForHost } from "@/lib/route-campaign";
import { sessionCountsForCampaign } from "@/lib/scan-session";
import type { Play } from "@/lib/rank";
import type { Lead } from "@/lib/store";

export type FunnelCounts = {
  gamesOnFloor: number;
  introductionsStarted: number;
  duplicates: number;
  emailsVerified: number;
  qualifiedLeads: number;
};

export type CampaignPerformance = {
  campaign: Campaign;
  funnel: FunnelCounts;
  spend: number;
  remaining: number;
};

export type SourceRow = {
  hostId: string;
  hostName: string;
  gamesOnFloor: number;
  introductions: number;
  qualifiedLeads: number;
  spend: number;
};

async function hostTimezone(hostId: string) {
  return (await getHost(hostId))?.timezone ?? "America/Chicago";
}

async function campaignOnFloor(campaign: Campaign, play: Play) {
  if (!campaign.eligibleHostIds.includes(play.hostId)) return false;
  const served = await todaysSponsorForHost(
    play.hostId,
    await hostTimezone(play.hostId),
    new Date(play.createdAt),
  );
  return served?.id === campaign.id;
}

function leadSpend(lead: Lead) {
  return lead.grossCpl ?? 0;
}

export async function funnelForCampaign(
  campaign: Campaign,
  plays: Play[],
  leads: Lead[],
): Promise<FunnelCounts> {
  const campaignLeads = leads.filter((lead) => lead.campaignId === campaign.id);
  const sessions = await sessionCountsForCampaign(campaign.id);
  const floorFlags = await Promise.all(
    plays.map((play) => campaignOnFloor(campaign, play)),
  );
  const gamesOnFloor =
    sessions.gamesCompleted ||
    plays.filter((_, index) => floorFlags[index]).length;
  return {
    gamesOnFloor,
    introductionsStarted: campaignLeads.length,
    duplicates: campaignLeads.filter((lead) => lead.status === "duplicate").length,
    emailsVerified: campaignLeads.filter((lead) => lead.emailVerified).length,
    qualifiedLeads: campaignLeads.filter((lead) => lead.status === "qualified")
      .length,
  };
}

export async function performanceForCampaign(
  campaign: Campaign,
  plays: Play[],
  leads: Lead[],
): Promise<CampaignPerformance> {
  const funnel = await funnelForCampaign(campaign, plays, leads);
  const spend = leads
    .filter(
      (lead) => lead.campaignId === campaign.id && lead.status === "qualified",
    )
    .reduce((sum, lead) => sum + leadSpend(lead), 0);

  return {
    campaign,
    funnel,
    spend,
    remaining: Math.max(0, campaign.fundedBalance),
  };
}

export async function performanceForStartup(
  startupId: string,
  plays: Play[],
  leads: Lead[],
) {
  const campaigns = await campaignsForStartup(startupId);
  const rows = await Promise.all(
    campaigns.map((campaign) => performanceForCampaign(campaign, plays, leads)),
  );
  const funnel: FunnelCounts = rows.reduce(
    (sum, row) => ({
      gamesOnFloor: sum.gamesOnFloor + row.funnel.gamesOnFloor,
      introductionsStarted:
        sum.introductionsStarted + row.funnel.introductionsStarted,
      duplicates: sum.duplicates + row.funnel.duplicates,
      emailsVerified: sum.emailsVerified + row.funnel.emailsVerified,
      qualifiedLeads: sum.qualifiedLeads + row.funnel.qualifiedLeads,
    }),
    {
      gamesOnFloor: 0,
      introductionsStarted: 0,
      duplicates: 0,
      emailsVerified: 0,
      qualifiedLeads: 0,
    },
  );
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const funded = rows.reduce((sum, row) => sum + row.campaign.fundedBalance, 0);
  const live = campaigns.filter((campaign) => campaign.status === "live");

  return {
    campaigns: rows,
    funnel,
    spend,
    funded,
    remaining: Math.max(0, funded),
    liveCount: live.length,
    cpl: live[0]?.grossCpl ?? campaigns[0]?.grossCpl ?? 0,
  };
}

export async function sourceRows(
  startupId: string,
  plays: Play[],
  leads: Lead[],
): Promise<SourceRow[]> {
  const campaigns = await campaignsForStartup(startupId);
  const hostIds = new Set(
    campaigns.flatMap((campaign) => campaign.eligibleHostIds),
  );
  const startupLeads = leads.filter((lead) => lead.startupId === startupId);

  return Promise.all(
    [...hostIds].map(async (hostId) => {
      const hostCampaigns = campaigns.filter((campaign) =>
        campaign.eligibleHostIds.includes(hostId),
      );
      const floorFlags = await Promise.all(
        plays
          .filter((play) => play.hostId === hostId)
          .map(async (play) => {
            for (const campaign of hostCampaigns) {
              if (await campaignOnFloor(campaign, play)) return true;
            }
            return false;
          }),
      );
      const hostLeads = startupLeads.filter((lead) => lead.hostId === hostId);
      const qualified = hostLeads.filter((lead) => lead.status === "qualified");
      const host = await getHost(hostId);

      return {
        hostId,
        hostName: host?.displayName ?? hostId,
        gamesOnFloor: floorFlags.filter(Boolean).length,
        introductions: hostLeads.length,
        qualifiedLeads: qualified.length,
        spend: qualified.reduce((sum, lead) => sum + leadSpend(lead), 0),
      };
    }),
  );
}

export function leadsForStartup(startupId: string, leads: Lead[]) {
  return leads
    .filter((lead) => lead.startupId === startupId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function qualifiedLeadsForStartup(startupId: string, leads: Lead[]) {
  return leadsForStartup(startupId, leads).filter(
    (lead) => lead.status === "qualified",
  );
}

export async function hostNameForLead(lead: Lead) {
  return (await getHost(lead.hostId))?.displayName ?? lead.hostId;
}

export async function placementForLead(lead: Lead) {
  return (await getPaw(lead.pawToken)).placementLabel;
}

export function canRevealContact(lead: Lead) {
  return lead.status === "qualified";
}

export { getCampaign };

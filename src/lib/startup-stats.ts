import { type Campaign } from "@/lib/campaigns";
import { campaignsForStartup, getCampaign } from "@/lib/campaign-resolve";
import { getHost } from "@/lib/hosts";
import { getPaw } from "@/lib/paws";
import { todaysSponsorForHost } from "@/lib/route-campaign";
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

function hostTimezone(hostId: string) {
  return getHost(hostId)?.timezone ?? "America/Chicago";
}

function campaignOnFloor(campaign: Campaign, play: Play) {
  if (!campaign.eligibleHostIds.includes(play.hostId)) return false;
  const served = todaysSponsorForHost(
    play.hostId,
    hostTimezone(play.hostId),
    new Date(play.createdAt),
  );
  return served?.id === campaign.id;
}

function leadSpend(lead: Lead) {
  return lead.grossCpl ?? getCampaign(lead.campaignId)?.grossCpl ?? 0;
}

export function funnelForCampaign(
  campaign: Campaign,
  plays: Play[],
  leads: Lead[],
): FunnelCounts {
  const campaignLeads = leads.filter(
    (lead) => lead.campaignId === campaign.id,
  );
  return {
    gamesOnFloor: plays.filter((play) => campaignOnFloor(campaign, play))
      .length,
    introductionsStarted: campaignLeads.length,
    duplicates: campaignLeads.filter((lead) => lead.status === "duplicate")
      .length,
    emailsVerified: campaignLeads.filter((lead) => lead.emailVerified).length,
    qualifiedLeads: campaignLeads.filter((lead) => lead.status === "qualified")
      .length,
  };
}

export function performanceForCampaign(
  campaign: Campaign,
  plays: Play[],
  leads: Lead[],
): CampaignPerformance {
  const funnel = funnelForCampaign(campaign, plays, leads);
  const spend = leads
    .filter(
      (lead) =>
        lead.campaignId === campaign.id && lead.status === "qualified",
    )
    .reduce((sum, lead) => sum + leadSpend(lead), 0);

  return {
    campaign,
    funnel,
    spend,
    remaining: Math.max(0, campaign.fundedBalance - spend),
  };
}

export function performanceForStartup(
  startupId: string,
  plays: Play[],
  leads: Lead[],
) {
  const campaigns = campaignsForStartup(startupId);
  const rows = campaigns.map((campaign) =>
    performanceForCampaign(campaign, plays, leads),
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
    remaining: Math.max(0, funded - spend),
    liveCount: live.length,
    cpl: live[0]?.grossCpl ?? campaigns[0]?.grossCpl ?? 0,
  };
}

export function sourceRows(
  startupId: string,
  plays: Play[],
  leads: Lead[],
): SourceRow[] {
  const campaigns = campaignsForStartup(startupId);
  const hostIds = new Set(campaigns.flatMap((campaign) => campaign.eligibleHostIds));
  const startupLeads = leads.filter((lead) => lead.startupId === startupId);

  return [...hostIds].map((hostId) => {
    const hostCampaigns = campaigns.filter((campaign) =>
      campaign.eligibleHostIds.includes(hostId),
    );
    const gamesOnFloor = plays.filter((play) =>
      play.hostId === hostId &&
      hostCampaigns.some((campaign) => campaignOnFloor(campaign, play)),
    ).length;
    const hostLeads = startupLeads.filter((lead) => lead.hostId === hostId);
    const qualified = hostLeads.filter((lead) => lead.status === "qualified");

    return {
      hostId,
      hostName: getHost(hostId)?.displayName ?? hostId,
      gamesOnFloor,
      introductions: hostLeads.length,
      qualifiedLeads: qualified.length,
      spend: qualified.reduce((sum, lead) => sum + leadSpend(lead), 0),
    };
  });
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

export function hostNameForLead(lead: Lead) {
  return getHost(lead.hostId)?.displayName ?? lead.hostId;
}

export function placementForLead(lead: Lead) {
  return getPaw(lead.pawToken).placementLabel;
}

export function canRevealContact(lead: Lead) {
  return lead.status === "qualified";
}

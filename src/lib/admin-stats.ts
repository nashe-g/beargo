import { listCampaigns } from "@/lib/campaign-resolve";
import { localDateInZone } from "@/lib/dates";
import { getDailyChallenge } from "@/lib/daily-challenge";
import { getHost, listHosts } from "@/lib/hosts";
import { hostTodayStats } from "@/lib/host-stats";
import { pawsForHost, listPaws } from "@/lib/paws";
import { todaysSponsorForHostRecord } from "@/lib/route-campaign";
import type { Play } from "@/lib/rank";
import type { Lead } from "@/lib/store";

const NETWORK_ZONE = "America/Chicago";

function leadLocalDate(lead: Lead) {
  return localDateInZone(
    getHost(lead.hostId)?.timezone ?? NETWORK_ZONE,
    new Date(lead.createdAt),
  );
}

export function adminOverview(plays: Play[], leads: Lead[]) {
  const today = localDateInZone(NETWORK_ZONE);
  const todayPlays = plays.filter((play) => play.localDate === today);
  const todayLeads = leads.filter((lead) => leadLocalDate(lead) === today);
  const qualified = leads.filter((lead) => lead.status === "qualified");
  const todayQualified = todayLeads.filter((lead) => lead.status === "qualified");
  const campaigns = listCampaigns();
  const hosts = listHosts();
  const floor = hosts.map((host) => ({
    host,
    sponsor: todaysSponsorForHostRecord(host),
  }));

  return {
    today,
    gamesToday: todayPlays.length,
    gamesAll: plays.length,
    introsToday: todayLeads.length,
    duplicatesToday: todayLeads.filter((lead) => lead.status === "duplicate")
      .length,
    verifiedToday: todayLeads.filter((lead) => lead.emailVerified).length,
    qlsToday: todayQualified.length,
    qlsAll: qualified.length,
    spendToday: todayQualified.reduce(
      (sum, lead) => sum + (lead.grossCpl ?? 0),
      0,
    ),
    spendAll: qualified.reduce((sum, lead) => sum + (lead.grossCpl ?? 0), 0),
    hostPotentialToday: todayQualified.reduce(
      (sum, lead) => sum + (lead.hostAmount ?? 0),
      0,
    ),
    liveCampaigns: campaigns.filter((campaign) => campaign.status === "live")
      .length,
    pausedCampaigns: campaigns.filter((campaign) => campaign.status === "paused")
      .length,
    darkHosts: floor.filter((row) => !row.sponsor),
    floor,
    pawCount: listPaws().length,
    hostCount: hosts.length,
  };
}

export function adminHostRows(plays: Play[], leads: Lead[]) {
  return listHosts().map((host) => ({
    host,
    today: hostTodayStats(host, plays, leads),
    sponsor: todaysSponsorForHostRecord(host),
    paws: pawsForHost(host.id),
    challenge: getDailyChallenge(host.id, host.timezone),
    campaigns: listCampaigns().filter((campaign) =>
      campaign.eligibleHostIds.includes(host.id),
    ),
  }));
}

export function networkDate() {
  return localDateInZone(NETWORK_ZONE);
}

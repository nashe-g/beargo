import {
  getHost,
  listCampaigns,
  listHosts,
  listPaws,
  pawsForHost,
} from "@/lib/catalog";
import { getDailyChallenge } from "@/lib/daily-challenge";
import { localDateInZone } from "@/lib/dates";
import { hostTodayStats } from "@/lib/host-stats";
import { todaysSponsorForHostRecord } from "@/lib/route-campaign";
import type { Play } from "@/lib/rank";
import type { Lead } from "@/lib/store";

const NETWORK_ZONE = "America/Chicago";

async function leadLocalDate(lead: Lead) {
  const host = await getHost(lead.hostId);
  return localDateInZone(host?.timezone ?? NETWORK_ZONE, new Date(lead.createdAt));
}

export async function adminOverview(plays: Play[], leads: Lead[]) {
  const today = localDateInZone(NETWORK_ZONE);
  const todayPlays = plays.filter((play) => play.localDate === today);
  const dates = await Promise.all(leads.map((lead) => leadLocalDate(lead)));
  const todayLeads = leads.filter((_, index) => dates[index] === today);
  const qualified = leads.filter((lead) => lead.status === "qualified");
  const todayQualified = todayLeads.filter((lead) => lead.status === "qualified");
  const campaigns = await listCampaigns();
  const hosts = await listHosts();
  const floor = await Promise.all(
    hosts.map(async (host) => ({
      host,
      sponsor: await todaysSponsorForHostRecord(host),
    })),
  );

  return {
    today,
    gamesToday: todayPlays.length,
    gamesAll: plays.length,
    introsToday: todayLeads.length,
    duplicatesToday: todayLeads.filter((lead) => lead.status === "duplicate").length,
    verifiedToday: todayLeads.filter((lead) => lead.emailVerified).length,
    qlsToday: todayQualified.length,
    qlsAll: qualified.length,
    spendToday: todayQualified.reduce((sum, lead) => sum + (lead.grossCpl ?? 0), 0),
    spendAll: qualified.reduce((sum, lead) => sum + (lead.grossCpl ?? 0), 0),
    hostPotentialToday: todayQualified.reduce(
      (sum, lead) => sum + (lead.hostAmount ?? 0),
      0,
    ),
    liveCampaigns: campaigns.filter((campaign) => campaign.status === "live").length,
    pausedCampaigns: campaigns.filter((campaign) => campaign.status === "paused")
      .length,
    darkHosts: floor.filter((row) => !row.sponsor),
    floor,
    pawCount: (await listPaws()).length,
    hostCount: hosts.length,
  };
}

export async function adminHostRows(plays: Play[], leads: Lead[]) {
  const hosts = await listHosts();
  const campaigns = await listCampaigns();
  return Promise.all(
    hosts.map(async (host) => ({
      host,
      today: hostTodayStats(host, plays, leads),
      sponsor: await todaysSponsorForHostRecord(host),
      paws: await pawsForHost(host.id),
      challenge: await getDailyChallenge(host.id, host.timezone),
      campaigns: campaigns.filter((campaign) =>
        campaign.eligibleHostIds.includes(host.id),
      ),
    })),
  );
}

export function networkDate() {
  return localDateInZone(NETWORK_ZONE);
}

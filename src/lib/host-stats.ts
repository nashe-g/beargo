import { getCampaign } from "@/lib/campaign-resolve";
import { localDateInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import type { Lead } from "@/lib/store";
import type { Play } from "@/lib/rank";

export type HostEarningRow = {
  id: string;
  at: string;
  source: string;
  amount: number;
};

export type HostTodayStats = {
  localDate: string;
  gamesFinished: number;
  fastestPerfectMs: number | null;
  introductionsStarted: number;
  qualifiedLeads: number;
  earnings: number;
};

export type HostMonthStats = {
  month: string;
  gamesFinished: number;
  qualifiedLeads: number;
  earnings: number;
  earningsPerHundredGames: number | null;
};

export function hostTodayStats(
  host: HostRecord,
  plays: Play[],
  leads: Lead[],
): HostTodayStats {
  const localDate = localDateInZone(host.timezone);
  const todayPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate === localDate,
  );
  const todayLeads = leads.filter(
    (lead) =>
      lead.hostId === host.id &&
      localDateInZone(host.timezone, new Date(lead.createdAt)) === localDate,
  );
  const qualified = todayLeads.filter((lead) => lead.status === "qualified");
  const perfect = todayPlays.filter((play) => play.correctCount === 3);
  const fastestPerfectMs =
    perfect.length === 0
      ? null
      : Math.min(...perfect.map((play) => play.totalResponseMs));

  return {
    localDate,
    gamesFinished: todayPlays.length,
    fastestPerfectMs,
    introductionsStarted: todayLeads.length,
    qualifiedLeads: qualified.length,
    earnings: qualified.reduce((sum, lead) => sum + (lead.hostAmount ?? 0), 0),
  };
}

export function hostMonthStats(
  host: HostRecord,
  plays: Play[],
  leads: Lead[],
): HostMonthStats {
  const today = localDateInZone(host.timezone);
  const month = today.slice(0, 7);
  const monthPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate.startsWith(month),
  );
  const qualified = leads.filter(
    (lead) =>
      lead.hostId === host.id &&
      lead.status === "qualified" &&
      (lead.qualifiedAt ?? lead.createdAt).slice(0, 7) === month,
  );
  const earnings = qualified.reduce(
    (sum, lead) => sum + (lead.hostAmount ?? 0),
    0,
  );

  return {
    month,
    gamesFinished: monthPlays.length,
    qualifiedLeads: qualified.length,
    earnings,
    earningsPerHundredGames:
      monthPlays.length === 0 ? null : (earnings / monthPlays.length) * 100,
  };
}

export function hostEarningsLedger(
  host: HostRecord,
  leads: Lead[],
): { available: number; rows: HostEarningRow[] } {
  const rows = leads
    .filter((lead) => lead.hostId === host.id && lead.status === "qualified")
    .map((lead) => ({
      id: lead.id,
      at: lead.qualifiedAt ?? lead.createdAt,
      source: `${getCampaign(lead.campaignId)?.name ?? "Sponsor"} introduction`,
      amount: lead.hostAmount ?? 0,
    }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    available: rows.reduce((sum, row) => sum + row.amount, 0),
    rows,
  };
}

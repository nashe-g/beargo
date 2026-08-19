import { localDateInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import type { Play } from "@/lib/rank";

export type HostTodayStats = {
  localDate: string;
  gamesFinished: number;
  fastestPerfectMs: number | null;
};

export type HostMonthStats = {
  month: string;
  gamesFinished: number;
};

export function hostTodayStats(host: HostRecord, plays: Play[]): HostTodayStats {
  const localDate = localDateInZone(host.timezone);
  const todayPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate === localDate,
  );
  const perfect = todayPlays.filter((play) => play.correctCount === 3);
  const fastestPerfectMs =
    perfect.length === 0
      ? null
      : Math.min(...perfect.map((play) => play.totalResponseMs));

  return {
    localDate,
    gamesFinished: todayPlays.length,
    fastestPerfectMs,
  };
}

export function hostMonthStats(host: HostRecord, plays: Play[]): HostMonthStats {
  const today = localDateInZone(host.timezone);
  const month = today.slice(0, 7);
  const monthPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate.startsWith(month),
  );

  return {
    month,
    gamesFinished: monthPlays.length,
  };
}

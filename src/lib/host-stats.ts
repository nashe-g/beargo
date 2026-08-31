import { serviceDayInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import type { Play } from "@/lib/rank";

export type HostTodayStats = {
  localDate: string;
  gamesFinished: number;
  bestWobble: number | null;
};

export type HostMonthStats = {
  month: string;
  gamesFinished: number;
};

export function hostTodayStats(host: HostRecord, plays: Play[]): HostTodayStats {
  const localDate = serviceDayInZone(host.timezone);
  const todayPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate === localDate,
  );
  const wobbles = todayPlays
    .map((play) => play.stackWobble)
    .filter((value): value is number => value != null);
  const bestWobble = wobbles.length === 0 ? null : Math.min(...wobbles);

  return {
    localDate,
    gamesFinished: todayPlays.length,
    bestWobble,
  };
}

export function hostMonthStats(host: HostRecord, plays: Play[]): HostMonthStats {
  const today = serviceDayInZone(host.timezone);
  const month = today.slice(0, 7);
  const monthPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate.startsWith(month),
  );

  return {
    month,
    gamesFinished: monthPlays.length,
  };
}

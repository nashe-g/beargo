import { and, gte, isNotNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { scanSessions } from "@/db/schema";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { serviceDayWindow } from "@/lib/dates";

/**
 * Table Spread tonight: a different device hitting GO shortly after someone
 * at the same venue finishes the tray (or skips). Scoped to the current
 * 6am service night so leftover solo-era stamps cannot move the number.
 */

export type SpreadRow = {
  hostId: string;
  deviceKey: string | null;
  gameStartedAt: Date | null;
  gameCompletedAt: Date | null;
};

export type TableSpreadStats = {
  starts: number;
  completions: number;
  followOn2m: number;
  followOn5m: number;
  followOn10m: number;
  /** followOn5m / (starts - followOn5m); null until there is data. */
  spread5m: number | null;
};

function followOnCount(rows: SpreadRow[], windowMs: number) {
  const byHost = new Map<string, SpreadRow[]>();
  for (const row of rows) {
    const list = byHost.get(row.hostId) ?? [];
    list.push(row);
    byHost.set(row.hostId, list);
  }
  let count = 0;
  for (const list of byHost.values()) {
    const completions = list
      .filter((row) => row.gameCompletedAt != null)
      .map((row) => ({
        device: row.deviceKey,
        at: row.gameCompletedAt!.getTime(),
      }));
    for (const row of list) {
      if (!row.gameStartedAt) continue;
      const startedAt = row.gameStartedAt.getTime();
      const followed = completions.some(
        (completion) =>
          completion.device !== row.deviceKey &&
          startedAt > completion.at &&
          startedAt - completion.at <= windowMs,
      );
      if (followed) count += 1;
    }
  }
  return count;
}

export function computeTableSpread(rows: SpreadRow[]): TableSpreadStats {
  const starts = rows.filter((row) => row.gameStartedAt != null).length;
  const completions = rows.filter((row) => row.gameCompletedAt != null).length;
  const followOn2m = followOnCount(rows, 2 * 60_000);
  const followOn5m = followOnCount(rows, 5 * 60_000);
  const followOn10m = followOnCount(rows, 10 * 60_000);
  const initial = starts - followOn5m;
  return {
    starts,
    completions,
    followOn2m,
    followOn5m,
    followOn10m,
    spread5m: initial > 0 && starts > 0 ? followOn5m / initial : null,
  };
}

export async function tableSpreadStats(): Promise<TableSpreadStats> {
  const window = serviceDayWindow(BEARGO_DAY_ZONE);
  const rows = await db()
    .select({
      hostId: scanSessions.hostId,
      deviceKey: scanSessions.deviceKey,
      gameStartedAt: scanSessions.gameStartedAt,
      gameCompletedAt: scanSessions.gameCompletedAt,
    })
    .from(scanSessions)
    .where(
      or(
        and(
          isNotNull(scanSessions.gameStartedAt),
          gte(scanSessions.gameStartedAt, window.start),
          lt(scanSessions.gameStartedAt, window.end),
        ),
        and(
          isNotNull(scanSessions.gameCompletedAt),
          gte(scanSessions.gameCompletedAt, window.start),
          lt(scanSessions.gameCompletedAt, window.end),
        ),
      ),
    );
  return computeTableSpread(rows);
}

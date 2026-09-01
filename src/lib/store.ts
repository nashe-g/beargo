import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { plays } from "@/db/schema";
import { serviceDayInZone } from "@/lib/dates";
import { isoRequired } from "@/lib/money";
import type { PawRecord } from "@/lib/paws";
import type { PlaySource } from "@/lib/play-source";
import { stackChallengeId } from "@/lib/stack";
import {
  comparePlays,
  neighborRows,
  rankPlay,
  type BoardNeighbor,
  type Play,
  type RankResult,
} from "@/lib/rank";

export type TopScore = { correctCount: number; stackWobble: number };

export type RecordedPlay = Play &
  RankResult & {
    topWobbles: number[];
    topScores: TopScore[];
    neighbors: BoardNeighbor[];
  };

function topWobblesFrom(board: Play[], count = 3) {
  return [...board]
    .sort(comparePlays)
    .slice(0, count)
    .map((entry) => entry.stackWobble)
    .filter((value): value is number => value != null);
}

function topScoresFrom(board: Play[], count = 5): TopScore[] {
  return [...board]
    .sort(comparePlays)
    .slice(0, count)
    .map((entry) => ({
      correctCount: entry.correctCount,
      stackWobble: entry.stackWobble ?? 0,
    }));
}

function mapPlay(row: typeof plays.$inferSelect): Play {
  return {
    id: row.id,
    pawToken: row.pawToken,
    hostId: row.hostId,
    challengeId: row.challengeId,
    localDate: row.localDate,
    correctCount: row.correctCount,
    totalResponseMs: row.totalResponseMs,
    pourMg: row.pourMg,
    stackWobble: row.stackWobble,
    boardName: row.boardName,
    rankingEligible: row.rankingEligible,
    playSource: row.playSource,
    createdAt: isoRequired(row.createdAt),
  };
}

export async function listPlays() {
  await ensurePlayColumns();
  const rows = await db().select().from(plays).orderBy(desc(plays.createdAt));
  return rows.map(mapPlay);
}

let pourColumnReady = false;
let stackColumnReady = false;
let boardNameColumnReady = false;
let playSourceColumnReady = false;

async function ensurePourMgColumn() {
  if (pourColumnReady) return;
  await db().execute(sql`ALTER TABLE plays ADD COLUMN IF NOT EXISTS pour_mg integer`);
  pourColumnReady = true;
}

async function ensureStackWobbleColumn() {
  if (stackColumnReady) return;
  await db().execute(
    sql`ALTER TABLE plays ADD COLUMN IF NOT EXISTS stack_wobble integer`,
  );
  stackColumnReady = true;
}

async function ensureBoardNameColumn() {
  if (boardNameColumnReady) return;
  await db().execute(
    sql`ALTER TABLE plays ADD COLUMN IF NOT EXISTS board_name text`,
  );
  boardNameColumnReady = true;
}

async function ensurePlaySourceColumn() {
  if (playSourceColumnReady) return;
  await db().execute(
    sql`ALTER TABLE plays ADD COLUMN IF NOT EXISTS play_source text`,
  );
  playSourceColumnReady = true;
}

async function ensurePlayColumns() {
  await ensurePourMgColumn();
  await ensureStackWobbleColumn();
  await ensureBoardNameColumn();
  await ensurePlaySourceColumn();
}

export async function recordPlay(input: {
  paw: PawRecord;
  challengeId: string;
  correctCount: number;
  totalResponseMs: number;
  pourMg?: number | null;
  stackWobble?: number | null;
  boardName?: string | null;
  sessionId?: string | null;
  deviceKey?: string | null;
  playSource?: PlaySource | null;
}): Promise<RecordedPlay> {
  await ensurePlayColumns();
  const localDate = serviceDayInZone(input.paw.timezone);
  let rankingEligible = true;
  if (input.deviceKey) {
    const prior = await db()
      .select({ id: plays.id })
      .from(plays)
      .where(
        and(
          eq(plays.hostId, input.paw.hostId),
          eq(plays.localDate, localDate),
          eq(plays.deviceKey, input.deviceKey),
          eq(plays.rankingEligible, true),
        ),
      )
      .limit(1);
    rankingEligible = prior.length === 0;
  }

  const play: Play = {
    id: randomUUID(),
    pawToken: input.paw.token,
    hostId: input.paw.hostId,
    challengeId: input.challengeId,
    localDate,
    correctCount: input.correctCount,
    totalResponseMs: input.totalResponseMs,
    pourMg: input.pourMg ?? null,
    stackWobble: input.stackWobble ?? null,
    boardName: input.boardName ?? null,
    rankingEligible,
    playSource: input.playSource ?? null,
    createdAt: new Date().toISOString(),
  };

  await db().insert(plays).values({
    id: play.id,
    pawToken: play.pawToken,
    hostId: play.hostId,
    challengeId: play.challengeId,
    sessionId: input.sessionId ?? null,
    localDate: play.localDate,
    correctCount: play.correctCount,
    totalResponseMs: play.totalResponseMs,
    pourMg: play.pourMg,
    stackWobble: play.stackWobble,
    boardName: play.boardName,
    rankingEligible,
    deviceKey: input.deviceKey ?? null,
    playSource: input.playSource ?? null,
  });

  const boardRows = await db()
    .select()
    .from(plays)
    .where(
      and(
        eq(plays.hostId, play.hostId),
        eq(plays.localDate, play.localDate),
        eq(plays.challengeId, play.challengeId),
      ),
    );
  const board = boardRows
    .map(mapPlay)
    .filter((entry) => entry.rankingEligible !== false || entry.id === play.id);

  return {
    ...play,
    ...rankPlay(board, play),
    topWobbles: topWobblesFrom(board),
    topScores: topScoresFrom(board),
    neighbors: neighborRows(board, play),
  };
}

/**
 * The ranked run this device already made tonight, if any. Used to hold
 * the one-attempt-per-night rule and to re-show a rank without relying
 * on sessionStorage.
 */
export async function rankedPlayForDevice(
  paw: PawRecord,
  deviceKey: string,
): Promise<RecordedPlay | null> {
  await ensurePlayColumns();
  const serviceDay = serviceDayInZone(paw.timezone);
  const rows = await db()
    .select()
    .from(plays)
    .where(
      and(
        eq(plays.hostId, paw.hostId),
        eq(plays.localDate, serviceDay),
        eq(plays.challengeId, stackChallengeId(serviceDay)),
      ),
    );
  const mineRow = rows.find(
    (row) => row.deviceKey === deviceKey && row.rankingEligible !== false,
  );
  if (!mineRow) return null;
  const board = rows
    .map(mapPlay)
    .filter((entry) => entry.rankingEligible !== false);
  const mine = mapPlay(mineRow);
  return {
    ...mine,
    ...rankPlay(board, mine),
    topWobbles: topWobblesFrom(board),
    topScores: topScoresFrom(board),
    neighbors: neighborRows(board, mine),
  };
}

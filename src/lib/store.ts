import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { plays } from "@/db/schema";
import { serviceDayInZone } from "@/lib/dates";
import { isoRequired } from "@/lib/money";
import type { PawRecord } from "@/lib/paws";
import {
  isLegacyCombinedKind,
  triviaChallengeId,
  type PlayKind,
} from "@/lib/play-kind";
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

function challengeIdForKind(kind: PlayKind, serviceDay: string) {
  return kind === "trivia"
    ? triviaChallengeId(serviceDay)
    : stackChallengeId(serviceDay);
}

function topWobblesFrom(board: Play[], kind: PlayKind, count = 3) {
  return [...board]
    .sort((a, b) => comparePlays(a, b, kind))
    .slice(0, count)
    .map((entry) => entry.stackWobble)
    .filter((value): value is number => value != null);
}

function topScoresFrom(board: Play[], kind: PlayKind, count = 5): TopScore[] {
  return [...board]
    .sort((a, b) => comparePlays(a, b, kind))
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
    kind: row.kind,
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
let kindColumnReady = false;

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

async function ensureKindColumn() {
  if (kindColumnReady) return;
  await db().execute(sql`ALTER TABLE plays ADD COLUMN IF NOT EXISTS kind text`);
  kindColumnReady = true;
}

async function ensurePlayColumns() {
  await ensurePourMgColumn();
  await ensureStackWobbleColumn();
  await ensureBoardNameColumn();
  await ensurePlaySourceColumn();
  await ensureKindColumn();
}

function countsAsKind(rowKind: string | null | undefined, kind: PlayKind) {
  if (isLegacyCombinedKind(rowKind)) return true;
  return rowKind === kind;
}

export async function recordPlay(input: {
  paw: PawRecord;
  kind: PlayKind;
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
      .select({ id: plays.id, kind: plays.kind })
      .from(plays)
      .where(
        and(
          eq(plays.hostId, input.paw.hostId),
          eq(plays.localDate, localDate),
          eq(plays.deviceKey, input.deviceKey),
          eq(plays.rankingEligible, true),
        ),
      );
    rankingEligible = !prior.some((row) => countsAsKind(row.kind, input.kind));
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
    kind: input.kind,
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
    kind: input.kind,
  });

  const boardRows = await db()
    .select()
    .from(plays)
    .where(
      and(
        eq(plays.hostId, play.hostId),
        eq(plays.localDate, play.localDate),
        eq(plays.challengeId, play.challengeId),
        eq(plays.kind, input.kind),
      ),
    );
  const board = boardRows
    .map(mapPlay)
    .filter((entry) => entry.rankingEligible !== false || entry.id === play.id);

  return {
    ...play,
    ...rankPlay(board, play, input.kind),
    topWobbles: topWobblesFrom(board, input.kind),
    topScores: topScoresFrom(board, input.kind),
    neighbors: neighborRows(board, play, input.kind),
  };
}

/**
 * The ranked run this device already made tonight for this game, if any.
 * A legacy combined night counts as both games.
 */
export async function rankedPlayForDevice(
  paw: PawRecord,
  deviceKey: string,
  kind: PlayKind = "stack",
): Promise<RecordedPlay | null> {
  await ensurePlayColumns();
  const serviceDay = serviceDayInZone(paw.timezone);
  const rows = await db()
    .select()
    .from(plays)
    .where(
      and(eq(plays.hostId, paw.hostId), eq(plays.localDate, serviceDay)),
    );
  const mineRow = rows.find(
    (row) =>
      row.deviceKey === deviceKey &&
      row.rankingEligible !== false &&
      countsAsKind(row.kind, kind),
  );
  if (!mineRow) return null;

  const challengeId = isLegacyCombinedKind(mineRow.kind)
    ? mineRow.challengeId
    : challengeIdForKind(kind, serviceDay);
  const boardRows = rows.filter((row) => {
    if (row.rankingEligible === false) return false;
    if (isLegacyCombinedKind(mineRow.kind)) {
      return row.challengeId === mineRow.challengeId;
    }
    return row.kind === kind && row.challengeId === challengeId;
  });
  const board = boardRows.map(mapPlay);
  const mine = mapPlay(mineRow);
  const rankKind = kind;
  return {
    ...mine,
    ...rankPlay(board, mine, rankKind),
    topWobbles: topWobblesFrom(board, rankKind),
    topScores: topScoresFrom(board, rankKind),
    neighbors: neighborRows(board, mine, rankKind),
  };
}

export function challengeIdForPlay(kind: PlayKind, serviceDay: string) {
  return challengeIdForKind(kind, serviceDay);
}

export async function nightCrownFor(
  paw: PawRecord,
  kind: PlayKind,
): Promise<{ handle: string; wobble: number | null; correctCount: number } | null> {
  await ensurePlayColumns();
  const serviceDay = serviceDayInZone(paw.timezone);
  const challengeId = challengeIdForKind(kind, serviceDay);
  const rows = await db()
    .select()
    .from(plays)
    .where(and(eq(plays.hostId, paw.hostId), eq(plays.localDate, serviceDay)));
  const board = rows
    .filter((row) => {
      if (row.rankingEligible === false) return false;
      if (row.kind === kind && row.challengeId === challengeId) return true;
      return isLegacyCombinedKind(row.kind);
    })
    .map(mapPlay)
    .sort((left, right) => comparePlays(left, right, kind));
  const lead = board[0];
  const handle = lead?.boardName?.trim();
  if (!lead || !handle) return null;
  return {
    handle,
    wobble: lead.stackWobble ?? null,
    correctCount: lead.correctCount,
  };
}

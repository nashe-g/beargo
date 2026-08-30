import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { plays } from "@/db/schema";
import { localDateInZone } from "@/lib/dates";
import { isoRequired } from "@/lib/money";
import type { PawRecord } from "@/lib/paws";
import { rankPlay, type Play, type RankResult } from "@/lib/rank";

export type RecordedPlay = Play & RankResult;

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
    rankingEligible: row.rankingEligible,
    createdAt: isoRequired(row.createdAt),
  };
}

export async function listPlays() {
  const rows = await db().select().from(plays).orderBy(desc(plays.createdAt));
  return rows.map(mapPlay);
}

let pourColumnReady = false;
let stackColumnReady = false;

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

export async function recordPlay(input: {
  paw: PawRecord;
  challengeId: string;
  correctCount: number;
  totalResponseMs: number;
  pourMg?: number | null;
  stackWobble?: number | null;
  sessionId?: string | null;
  deviceKey?: string | null;
}): Promise<RecordedPlay> {
  await ensurePourMgColumn();
  await ensureStackWobbleColumn();
  const localDate = localDateInZone(input.paw.timezone);
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
    rankingEligible,
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
    rankingEligible,
    deviceKey: input.deviceKey ?? null,
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

  return { ...play, ...rankPlay(board, play) };
}

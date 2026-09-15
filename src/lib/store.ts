import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { plays } from "@/db/schema";
import { isoRequired } from "@/lib/money";
import type { Play } from "@/lib/rank";

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

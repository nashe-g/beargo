import { randomInt, randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { nightTableMembers, nightTables } from "@/db/schema";
import { TABLE_CODE_LENGTH, TABLE_NAME_MAX } from "@/lib/config";
import { networkSlateDate } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { ensureNightTables } from "@/lib/night-table-schema";
import type {
  NightBoard,
  NightCombined,
  NightTableMemberView,
  NightTableReveal,
  NightTableStatus,
  NightTableView,
  NightTrayMode,
  NightTrayView,
} from "@/lib/night-table-types";
import { getAnySlate, getPublishedSlate } from "@/lib/question-slate-store";
import {
  asQuestions,
  packsForNight,
  isFullNightSlate,
} from "@/lib/question-packs";
import type { PawRecord } from "@/lib/paws";
import type { Question } from "@/lib/questions";
import { scoreStackRound, seedStackRound } from "@/lib/stack";
import {
  combinedNightScore,
  compareCombined,
  NIGHT_DONE,
  ROUND1_DONE,
  SKIP_WOBBLE_TENTHS,
} from "@/lib/table-night";
import { stampDevicesAtHost } from "@/lib/scan-session";
import {
  CODE_ALPHABET,
  foldKey,
  parseJoinCode,
  parseNickname,
  parseTableName,
} from "@/lib/table-copy";
import {
  asTableAnswers,
  assignPackIndexes,
  carriedNickname,
  compareTableScores,
  parseResponseMs,
  publicQuestion,
  scorePerson,
  scoreTable,
  type PersonScore,
  type TableAnswer,
} from "@/lib/table-test";

export type NightTableWrite =
  | { ok: true; table: NightTableView }
  | { ok: false; status: number; error: string };

function mintJoinCode() {
  let code = "";
  for (let i = 0; i < TABLE_CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function asStatus(raw: string): NightTableStatus {
  if (
    raw === "open" ||
    raw === "locked" ||
    raw === "live" ||
    raw === "revealed" ||
    raw === "tray" ||
    raw === "night" ||
    raw === "room"
  ) {
    return raw;
  }
  return "open";
}

function pastRound1(status: NightTableStatus) {
  return (ROUND1_DONE as string[]).includes(status);
}

async function membersFor(tableId: string) {
  return db()
    .select()
    .from(nightTableMembers)
    .where(eq(nightTableMembers.tableId, tableId))
    .orderBy(asc(nightTableMembers.createdAt));
}

async function packsForTable(
  table: typeof nightTables.$inferSelect,
): Promise<Question[][]> {
  const stored = asQuestions(table.slateSnapshot);
  if (stored.length) return packsForNight(stored);
  const date = table.slateDate ?? table.serviceDay;
  const questions =
    (await getPublishedSlate(date)) ?? (await getAnySlate(date));
  if (questions.length && table.round1GoAt) {
    await db()
      .update(nightTables)
      .set({
        slateSnapshot: questions,
        slateDate: date,
      })
      .where(eq(nightTables.id, table.id));
  }
  return packsForNight(questions);
}

function packForMember(
  packs: Question[][],
  packIndex: number | null | undefined,
) {
  if (!packs.length) return [];
  if (packIndex == null || packIndex < 0) return packs[0];
  return packs[packIndex] ?? packs[packIndex % packs.length];
}

function personFromMember(
  member: typeof nightTableMembers.$inferSelect,
  packs: Question[][],
): PersonScore {
  return scorePerson(
    packForMember(packs, member.packIndex),
    asTableAnswers(member.round1Answers),
  );
}

async function rankAmongTonight(
  paw: PawRecord,
  serviceDay: string,
  tableId: string,
  packs: Question[][],
  members: (typeof nightTableMembers.$inferSelect)[],
): Promise<{ rank: number; tableCount: number; score: ReturnType<typeof scoreTable> }> {
  const mine = scoreTable(members.map((member) => personFromMember(member, packs)));
  const siblings = await db()
    .select()
    .from(nightTables)
    .where(
      and(
        eq(nightTables.hostId, paw.hostId),
        eq(nightTables.serviceDay, serviceDay),
        inArray(nightTables.status, [...ROUND1_DONE]),
      ),
    );
  const scored: { id: string; nameKey: string; score: ReturnType<typeof scoreTable> }[] =
    [];
  for (const sibling of siblings) {
    if (sibling.id === tableId) continue;
    const people = await membersFor(sibling.id);
    scored.push({
      id: sibling.id,
      nameKey: sibling.nameKey,
      score: scoreTable(people.map((member) => personFromMember(member, packs))),
    });
  }
  scored.push({ id: tableId, nameKey: "", score: mine });
  scored.sort((left, right) => {
    const byScore = compareTableScores(left.score, right.score);
    if (byScore !== 0) return byScore;
    return left.id.localeCompare(right.id);
  });
  const rank = scored.findIndex((row) => row.id === tableId) + 1;
  return { rank, tableCount: scored.length, score: mine };
}

async function round1Board(
  paw: PawRecord,
  serviceDay: string,
  tableId: string,
  packs: Question[][],
  members: (typeof nightTableMembers.$inferSelect)[],
): Promise<NightBoard> {
  const ranked = await rankAmongTonight(paw, serviceDay, tableId, packs, members);
  const siblings = await db()
    .select()
    .from(nightTables)
    .where(
      and(
        eq(nightTables.hostId, paw.hostId),
        eq(nightTables.serviceDay, serviceDay),
        inArray(nightTables.status, [...ROUND1_DONE]),
      ),
    );
  const rows = await Promise.all(
    siblings.map(async (sibling) => {
      const people = await membersFor(sibling.id);
      const score = scoreTable(people.map((member) => personFromMember(member, packs)));
      return { sibling, score };
    }),
  );
  rows.sort((left, right) => {
    const byScore = compareTableScores(left.score, right.score);
    if (byScore !== 0) return byScore;
    return left.sibling.id.localeCompare(right.sibling.id);
  });
  return {
    rank: ranked.rank,
    tableCount: ranked.tableCount,
    rows: rows.map((row, index) => ({
      name: row.sibling.name,
      mine: row.sibling.id === tableId,
      rank: index + 1,
      correctCount: row.score.correctCount,
      asked: row.score.asked,
      averageMs: row.score.averageMs,
    })),
  };
}

async function combinedBoard(
  paw: PawRecord,
  table: typeof nightTables.$inferSelect,
  packs: Question[][],
  members: (typeof nightTableMembers.$inferSelect)[],
): Promise<NightCombined | null> {
  if (table.round2Wobble == null) return null;
  const mineScore = scoreTable(members.map((member) => personFromMember(member, packs)));
  const mineCombined =
    table.combinedScore ?? combinedNightScore(mineScore, table.round2Wobble);
  const siblings = await db()
    .select()
    .from(nightTables)
    .where(
      and(
        eq(nightTables.hostId, paw.hostId),
        eq(nightTables.serviceDay, table.serviceDay),
        inArray(nightTables.status, [...NIGHT_DONE]),
      ),
    );
  const rows = siblings
    .filter((row) => row.round2Wobble != null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      wobble: row.round2Wobble ?? SKIP_WOBBLE_TENTHS,
      skipped: Boolean(row.round2Skipped),
      combined: row.combinedScore ?? Number.POSITIVE_INFINITY,
    }));
  if (!rows.some((row) => row.id === table.id)) {
    rows.push({
      id: table.id,
      name: table.name,
      wobble: table.round2Wobble,
      skipped: Boolean(table.round2Skipped),
      combined: mineCombined,
    });
  }
  rows.sort((left, right) => {
    const byScore = compareCombined(left.combined, right.combined);
    if (byScore !== 0) return byScore;
    return left.id.localeCompare(right.id);
  });
  const rank = rows.findIndex((row) => row.id === table.id) + 1;
  const prior = table.round1Rank ?? rank;
  return {
    rank,
    tableCount: rows.length,
    jumped: prior - rank,
    wobble: table.round2Wobble,
    skipped: Boolean(table.round2Skipped),
    rows: rows.map((row, index) => ({
      name: row.name,
      mine: row.id === table.id,
      rank: index + 1,
      wobble: row.wobble,
      skipped: row.skipped,
    })),
  };
}

function trayView(
  table: typeof nightTables.$inferSelect,
  members: (typeof nightTableMembers.$inferSelect)[],
  deviceKey: string | null,
  paw: PawRecord,
): NightTrayView {
  const mode = (table.round2Mode as NightTrayMode | null) ?? null;
  const champion = members.find(
    (member) => member.deviceKey === table.championDeviceKey,
  );
  const mine = members.find((member) => member.deviceKey === deviceKey);
  const waiting =
    mode === "champion"
      ? champion && !champion.round2FinishedAt
        ? champion.deviceKey === deviceKey
          ? []
          : [champion.nickname]
        : []
      : members
          .filter((member) => !member.round2FinishedAt && member.deviceKey !== deviceKey)
          .map((member) => member.nickname);
  const minePlays =
    Boolean(mine) &&
    !mine?.round2FinishedAt &&
    (mode === "everyone" ||
      (mode === "champion" && mine?.deviceKey === table.championDeviceKey));
  return {
    mode: mode === "skip" ? "skip" : mode,
    championNickname: champion?.nickname ?? null,
    minePlays,
    waitingNames: waiting,
    seed: seedStackRound(table.serviceDay, paw.hostId),
  };
}

async function viewFor(
  table: typeof nightTables.$inferSelect,
  deviceKey: string | null,
  paw: PawRecord,
): Promise<NightTableView> {
  const members = await membersFor(table.id);
  const status = asStatus(table.status);
  const packs = pastRound1(status) || status === "live" ? await packsForTable(table) : [];
  const people = members.map((member) => personFromMember(member, packs));
  const showPeople = pastRound1(status);
  const carried = showPeople
    ? carriedNickname(
        members.map((member, index) => ({
          nickname: member.nickname,
          ...people[index],
        })),
      )
    : null;
  const revealRows: NightTableReveal["people"] | null = showPeople
    ? members.map((member, index) => ({
        nickname: member.nickname,
        mine: Boolean(deviceKey) && member.deviceKey === deviceKey,
        correctCount: people[index].correctCount,
        asked: people[index].asked,
        averageMs: people[index].averageMs,
        carried: carried === member.nickname,
      }))
    : null;
  const ranked = showPeople
    ? await rankAmongTonight(paw, table.serviceDay, table.id, packs, members)
    : null;
  const board = showPeople
    ? await round1Board(paw, table.serviceDay, table.id, packs, members)
    : null;
  const night =
    status === "night" || status === "room"
      ? await combinedBoard(paw, table, packs, members)
      : null;

  const mine = members.find((member) => member.deviceKey === deviceKey);
  const minePack = mine ? packForMember(packs, mine.packIndex) : [];
  const mineAnswers = mine ? asTableAnswers(mine.round1Answers) : [];

  const memberViews: NightTableMemberView[] = members.map((member, index) => ({
    nickname: member.nickname,
    isCreator: member.isCreator,
    mine: Boolean(deviceKey) && member.deviceKey === deviceKey,
    ready: Boolean(member.readyAt),
    finished: Boolean(member.round1FinishedAt),
    correctCount: showPeople ? people[index].correctCount : undefined,
    averageMs: showPeople ? people[index].averageMs : undefined,
    carried: showPeople ? carried === member.nickname : undefined,
  }));

  return {
    id: table.id,
    name: table.name,
    joinCode: table.joinCode,
    status,
    serviceDay: table.serviceDay,
    venue: paw.hostDisplayName,
    members: memberViews,
    mineCreator: members.some(
      (member) => member.isCreator && deviceKey === member.deviceKey,
    ),
    allReady: members.length > 0 && members.every((member) => member.readyAt),
    play:
      status === "live" && mine && minePack.length
        ? {
            questions: minePack.map(publicQuestion),
            answers: mineAnswers,
          }
        : null,
    reveal:
      ranked && revealRows
        ? {
            correctCount: ranked.score.correctCount,
            asked: ranked.score.asked,
            averageMs: ranked.score.averageMs,
            rank: ranked.rank,
            tableCount: ranked.tableCount,
            people: revealRows,
          }
        : null,
    board,
    tray: status === "tray" ? trayView(table, members, deviceKey, paw) : null,
    night,
  };
}

async function reload(
  tableId: string,
  deviceKey: string,
  paw: PawRecord,
): Promise<NightTableWrite> {
  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, tableId))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "No table with that code." };
  return { ok: true, table: await viewFor(row, deviceKey, paw) };
}

export async function tableForDeviceTonight(
  paw: PawRecord,
  deviceKey: string | null,
): Promise<NightTableView | null> {
  if (!deviceKey) return null;
  await ensureNightTables();
  const serviceDay = serviceDayInZone(paw.timezone);
  const rows = await db()
    .select({
      table: nightTables,
      member: nightTableMembers,
    })
    .from(nightTableMembers)
    .innerJoin(nightTables, eq(nightTableMembers.tableId, nightTables.id))
    .where(
      and(
        eq(nightTableMembers.deviceKey, deviceKey),
        eq(nightTables.hostId, paw.hostId),
        eq(nightTables.serviceDay, serviceDay),
      ),
    )
    .limit(1);
  const hit = rows[0];
  if (!hit) return null;
  return viewFor(hit.table, deviceKey, paw);
}

export async function getTableByCode(
  paw: PawRecord,
  codeRaw: unknown,
  deviceKey: string | null,
): Promise<NightTableWrite> {
  await ensureNightTables();
  const code = parseJoinCode(codeRaw);
  if (!code) {
    return { ok: false, status: 400, error: "That code doesn’t look right." };
  }
  const serviceDay = serviceDayInZone(paw.timezone);
  const [row] = await db()
    .select()
    .from(nightTables)
    .where(
      and(eq(nightTables.hostId, paw.hostId), eq(nightTables.joinCode, code)),
    )
    .limit(1);
  if (!row) {
    return { ok: false, status: 404, error: "No table with that code." };
  }
  if (row.serviceDay !== serviceDay) {
    return { ok: false, status: 410, error: "That table was last night." };
  }
  return {
    ok: true,
    table: await viewFor(row, deviceKey, paw),
  };
}

async function unusedCode(hostId: string, serviceDay: string) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const joinCode = mintJoinCode();
    const [taken] = await db()
      .select({ id: nightTables.id })
      .from(nightTables)
      .where(
        and(
          eq(nightTables.hostId, hostId),
          eq(nightTables.serviceDay, serviceDay),
          eq(nightTables.joinCode, joinCode),
        ),
      )
      .limit(1);
    if (!taken) return joinCode;
  }
  return null;
}

export async function createNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  name: unknown;
  nickname: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const existing = await tableForDeviceTonight(input.paw, input.deviceKey);
  if (existing) return { ok: true, table: existing };

  const name = parseTableName(input.name);
  if (!name) {
    return {
      ok: false,
      status: 400,
      error: `Name the table, up to ${TABLE_NAME_MAX} characters.`,
    };
  }
  const nickname = parseNickname(input.nickname);
  if (!nickname) {
    return { ok: false, status: 400, error: "What do they call you?" };
  }

  const serviceDay = serviceDayInZone(input.paw.timezone);
  const joinCode = await unusedCode(input.paw.hostId, serviceDay);
  if (!joinCode) {
    return { ok: false, status: 500, error: "Couldn’t mint a code. Try again." };
  }

  const id = randomUUID();
  try {
    await db().insert(nightTables).values({
      id,
      hostId: input.paw.hostId,
      pawToken: input.paw.token,
      serviceDay,
      name,
      nameKey: foldKey(name),
      joinCode,
      status: "open" satisfies NightTableStatus,
    });
  } catch {
    return {
      ok: false,
      status: 409,
      error: "A table already took that name tonight.",
    };
  }

  try {
    await db().insert(nightTableMembers).values({
      id: randomUUID(),
      tableId: id,
      deviceKey: input.deviceKey,
      nickname,
      nicknameKey: foldKey(nickname),
      isCreator: true,
    });
  } catch {
    await db().delete(nightTables).where(eq(nightTables.id, id));
    return { ok: false, status: 500, error: "Couldn’t sit the table." };
  }

  return reload(id, input.deviceKey, input.paw);
}

export async function joinNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
  nickname: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const sitting = await tableForDeviceTonight(input.paw, input.deviceKey);
  if (sitting) {
    const code = parseJoinCode(input.code);
    if (code && sitting.joinCode === code) return { ok: true, table: sitting };
    return {
      ok: false,
      status: 409,
      error: `You’re already at ${sitting.name} tonight.`,
    };
  }

  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status !== "open") {
    return {
      ok: false,
      status: 409,
      error: "They already started.",
    };
  }

  const nickname = parseNickname(input.nickname);
  if (!nickname) {
    return { ok: false, status: 400, error: "What do they call you?" };
  }

  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  if (!row || row.status !== "open") {
    return { ok: false, status: 409, error: "They already started." };
  }

  try {
    await db().insert(nightTableMembers).values({
      id: randomUUID(),
      tableId: row.id,
      deviceKey: input.deviceKey,
      nickname,
      nicknameKey: foldKey(nickname),
      isCreator: false,
    });
  } catch {
    return {
      ok: false,
      status: 409,
      error: "Someone at this table already has that name.",
    };
  }

  return reload(row.id, input.deviceKey, input.paw);
}

export async function lockNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (!found.table.mineCreator) {
    return { ok: false, status: 403, error: "The person who sat the table starts." };
  }
  if (found.table.status !== "open") {
    return { ok: true, table: found.table };
  }

  await db()
    .update(nightTables)
    .set({ status: "locked", lockedAt: new Date() })
    .where(eq(nightTables.id, found.table.id));

  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function readyNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "live" || found.table.status === "revealed") {
    return { ok: true, table: found.table };
  }
  if (found.table.status !== "locked") {
    return { ok: false, status: 409, error: "Sit the table first." };
  }
  const mine = found.table.members.find((member) => member.mine);
  if (!mine) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }

  await db()
    .update(nightTableMembers)
    .set({ readyAt: new Date() })
    .where(
      and(
        eq(nightTableMembers.tableId, found.table.id),
        eq(nightTableMembers.deviceKey, input.deviceKey),
      ),
    );

  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function goNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "live" || found.table.status === "revealed") {
    return { ok: true, table: found.table };
  }
  if (found.table.status !== "locked") {
    return { ok: false, status: 409, error: "Sit the table first." };
  }
  if (!found.table.members.some((member) => member.mine)) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  if (!found.table.allReady) {
    return { ok: false, status: 409, error: "Wait until everyone’s ready." };
  }

  const slateDate = networkSlateDate();
  const questions = (await getPublishedSlate(slateDate)) ?? [];
  if (!isFullNightSlate(questions)) {
    return {
      ok: false,
      status: 409,
      error: "Tonight’s 21 questions aren’t published yet.",
    };
  }
  const packs = packsForNight(questions);

  const people = await membersFor(found.table.id);
  const indexes = assignPackIndexes(people.length, packs.length, found.table.id);
  const packMap: Record<string, number> = {};
  for (const [index, member] of people.entries()) {
    packMap[member.deviceKey] = indexes[index] ?? 0;
    await db()
      .update(nightTableMembers)
      .set({ packIndex: indexes[index] ?? 0 })
      .where(eq(nightTableMembers.id, member.id));
  }

  await db()
    .update(nightTables)
    .set({
      status: "live" satisfies NightTableStatus,
      round1GoAt: new Date(),
      packMap,
      slateDate,
      slateSnapshot: questions,
    })
    .where(eq(nightTables.id, found.table.id));

  await stampDevicesAtHost(
    input.paw.hostId,
    people.map((member) => member.deviceKey),
    "game_started",
    input.paw.timezone,
  );

  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function answerNightTable(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
  questionId: unknown;
  choiceId: unknown;
  responseMs: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "revealed" || pastRound1(found.table.status)) {
    return { ok: true, table: found.table };
  }
  if (found.table.status !== "live") {
    return { ok: false, status: 409, error: "Wait for GO." };
  }

  const [member] = await db()
    .select()
    .from(nightTableMembers)
    .where(
      and(
        eq(nightTableMembers.tableId, found.table.id),
        eq(nightTableMembers.deviceKey, input.deviceKey),
      ),
    )
    .limit(1);
  if (!member) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  if (member.round1FinishedAt) {
    return reload(found.table.id, input.deviceKey, input.paw);
  }

  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "No table with that code." };

  const packs = await packsForTable(row);
  const pack = packForMember(packs, member.packIndex);
  const answers = asTableAnswers(member.round1Answers);
  const next = pack[answers.length];
  if (!next) {
    return reload(found.table.id, input.deviceKey, input.paw);
  }
  if (typeof input.questionId !== "string" || input.questionId !== next.id) {
    return { ok: false, status: 409, error: "This one’s next." };
  }
  if (
    typeof input.choiceId !== "string" ||
    next.choices.every((choice) => choice.id !== input.choiceId)
  ) {
    return { ok: false, status: 400, error: "Pick one." };
  }
  const responseMs = parseResponseMs(input.responseMs);
  if (responseMs == null) {
    return { ok: false, status: 400, error: "That time doesn’t look right." };
  }

  const nextAnswers: TableAnswer[] = [
    ...answers,
    {
      questionId: next.id,
      choiceId: input.choiceId,
      responseMs,
    },
  ];
  const finished = nextAnswers.length >= pack.length;
  await db()
    .update(nightTableMembers)
    .set({
      round1Answers: nextAnswers,
      round1FinishedAt: finished ? new Date() : null,
    })
    .where(eq(nightTableMembers.id, member.id));

  if (finished) {
    const people = await membersFor(found.table.id);
    const allDone = people.every(
      (row) => row.id === member.id || row.round1FinishedAt,
    );
    if (allDone) {
      const ranked = await rankAmongTonight(
        input.paw,
        found.table.serviceDay,
        found.table.id,
        packs,
        people,
      );
      await db()
        .update(nightTables)
        .set({
          status: "revealed" satisfies NightTableStatus,
          round1Rank: ranked.rank,
        })
        .where(eq(nightTables.id, found.table.id));
    }
  }

  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function pickTrayMode(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
  mode: unknown;
  champion: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "tray") return { ok: true, table: found.table };
  if (found.table.status !== "revealed") {
    return { ok: false, status: 409, error: "Finish the test first." };
  }
  if (!found.table.members.some((member) => member.mine)) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  const mode = input.mode === "champion" || input.mode === "everyone" ? input.mode : null;
  if (!mode) {
    return { ok: false, status: 400, error: "Send your steadiest, or everyone." };
  }
  const people = await membersFor(found.table.id);
  let championKey = people[0]?.deviceKey ?? input.deviceKey;
  if (mode === "champion") {
    if (people.length === 1) {
      championKey = people[0]!.deviceKey;
    } else {
      const nick =
        typeof input.champion === "string" ? foldKey(input.champion) : "";
      const hit = people.find((member) => foldKey(member.nickname) === nick);
      if (!hit) {
        return { ok: false, status: 400, error: "Who’s carrying?" };
      }
      championKey = hit.deviceKey;
    }
  }
  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "No table with that code." };
  await freezeRound1Rank(row, input.paw);
  await db()
    .update(nightTables)
    .set({
      status: "tray" satisfies NightTableStatus,
      round2Mode: mode,
      championDeviceKey: mode === "champion" ? championKey : null,
    })
    .where(eq(nightTables.id, found.table.id));
  return reload(found.table.id, input.deviceKey, input.paw);
}

async function freezeRound1Rank(
  table: typeof nightTables.$inferSelect,
  paw: PawRecord,
) {
  if (table.round1Rank != null) return;
  const people = await membersFor(table.id);
  const packs = await packsForTable(table);
  const ranked = await rankAmongTonight(
    paw,
    table.serviceDay,
    table.id,
    packs,
    people,
  );
  await db()
    .update(nightTables)
    .set({ round1Rank: ranked.rank })
    .where(eq(nightTables.id, table.id));
}

async function closeTray(
  table: typeof nightTables.$inferSelect,
  paw: PawRecord,
  wobble: number,
  skipped: boolean,
) {
  const people = await membersFor(table.id);
  const packs = await packsForTable(table);
  await freezeRound1Rank(table, paw);
  const round1 = scoreTable(people.map((member) => personFromMember(member, packs)));
  const combined = combinedNightScore(round1, wobble);
  await db()
    .update(nightTables)
    .set({
      status: "night" satisfies NightTableStatus,
      round2Wobble: wobble,
      combinedScore: combined,
      round2Skipped: skipped,
      round2Mode: skipped ? "skip" : table.round2Mode,
    })
    .where(eq(nightTables.id, table.id));
  await stampDevicesAtHost(
    paw.hostId,
    people.map((member) => member.deviceKey),
    "game_completed",
    paw.timezone,
  );
}

export async function skipTray(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "night" || found.table.status === "room") {
    return { ok: true, table: found.table };
  }
  if (found.table.status !== "revealed" && found.table.status !== "tray") {
    return { ok: false, status: 409, error: "Finish the test first." };
  }
  if (!found.table.members.some((member) => member.mine)) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "No table with that code." };
  await freezeRound1Rank(row, input.paw);
  await closeTray(row, input.paw, SKIP_WOBBLE_TENTHS, true);
  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function submitTray(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
  carries: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status !== "tray") {
    return { ok: false, status: 409, error: "The tray isn’t open." };
  }
  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "No table with that code." };

  const [member] = await db()
    .select()
    .from(nightTableMembers)
    .where(
      and(
        eq(nightTableMembers.tableId, found.table.id),
        eq(nightTableMembers.deviceKey, input.deviceKey),
      ),
    )
    .limit(1);
  if (!member) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  if (row.round2Mode === "champion" && row.championDeviceKey !== input.deviceKey) {
    return { ok: false, status: 403, error: "They’re carrying." };
  }
  if (member.round2FinishedAt) {
    return reload(found.table.id, input.deviceKey, input.paw);
  }

  const scored = scoreStackRound(row.serviceDay, input.paw.hostId, input.carries);
  if (!scored) {
    return { ok: false, status: 400, error: "That carry doesn’t look right." };
  }

  await db()
    .update(nightTableMembers)
    .set({
      round2Carries: scored.wobbles.map((wobble, index) => ({
        glasses: seedStackRound(row.serviceDay, input.paw.hostId).carries[index]
          ?.glasses ?? 0,
        wobble,
      })),
      round2Wobble: scored.stackWobble,
      round2FinishedAt: new Date(),
    })
    .where(eq(nightTableMembers.id, member.id));

  const people = await membersFor(found.table.id);
  const needed =
    row.round2Mode === "champion"
      ? people.filter((person) => person.deviceKey === row.championDeviceKey)
      : people;
  const allDone = needed.every(
    (person) => person.id === member.id || person.round2FinishedAt,
  );
  if (allDone) {
    const wobbles = needed.map((person) =>
      person.id === member.id ? scored.stackWobble : (person.round2Wobble ?? 0),
    );
    const mean = Math.round(
      wobbles.reduce((sum, value) => sum + value, 0) / wobbles.length,
    );
    await closeTray(row, input.paw, mean, false);
  }
  return reload(found.table.id, input.deviceKey, input.paw);
}

export async function enterRoom(input: {
  paw: PawRecord;
  deviceKey: string;
  code: unknown;
}): Promise<NightTableWrite> {
  await ensureNightTables();
  const found = await getTableByCode(input.paw, input.code, input.deviceKey);
  if (!found.ok) return found;
  if (found.table.status === "room") return { ok: true, table: found.table };
  if (found.table.status !== "night") {
    return { ok: false, status: 409, error: "Finish the night first." };
  }
  if (!found.table.members.some((member) => member.mine)) {
    return { ok: false, status: 403, error: "You’re not at this table." };
  }
  await db()
    .update(nightTables)
    .set({ status: "room" satisfies NightTableStatus })
    .where(eq(nightTables.id, found.table.id));
  return reload(found.table.id, input.deviceKey, input.paw);
}

export type HostNightTableRow = {
  name: string;
  joinCode: string;
  status: NightTableStatus;
  people: number;
  round1Rank: number | null;
  combinedRank: number | null;
  wobble: number | null;
  skipped: boolean;
};

export type HostNightSnapshot = {
  serviceDay: string;
  tables: number;
  people: number;
  finishedTest: number;
  finishedTray: number;
  inRoom: number;
  bestWobble: number | null;
  rows: HostNightTableRow[];
};

export async function hostNightSnapshot(
  hostId: string,
  serviceDay: string,
): Promise<HostNightSnapshot> {
  await ensureNightTables();
  const tables = await db()
    .select()
    .from(nightTables)
    .where(
      and(eq(nightTables.hostId, hostId), eq(nightTables.serviceDay, serviceDay)),
    );
  const ids = tables.map((row) => row.id);
  const members =
    ids.length === 0
      ? []
      : await db()
          .select({
            tableId: nightTableMembers.tableId,
          })
          .from(nightTableMembers)
          .where(inArray(nightTableMembers.tableId, ids));
  const peopleByTable = new Map<string, number>();
  for (const member of members) {
    peopleByTable.set(member.tableId, (peopleByTable.get(member.tableId) ?? 0) + 1);
  }
  const ranked = [...tables]
    .filter((row) => row.combinedScore != null)
    .sort((left, right) => compareCombined(left.combinedScore!, right.combinedScore!));
  const combinedRank = new Map<string, number>();
  ranked.forEach((row, index) => combinedRank.set(row.id, index + 1));
  const played = tables.filter((row) => pastRound1(asStatus(row.status)));
  const trayDone = tables.filter(
    (row) => row.round2Wobble != null && !row.round2Skipped,
  );
  const best = trayDone.map((row) => row.round2Wobble as number);
  const rows: HostNightTableRow[] = [...tables]
    .sort((left, right) => {
      const leftRank = combinedRank.get(left.id) ?? left.round1Rank ?? 999;
      const rightRank = combinedRank.get(right.id) ?? right.round1Rank ?? 999;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.name.localeCompare(right.name);
    })
    .map((row) => ({
      name: row.name,
      joinCode: row.joinCode,
      status: asStatus(row.status),
      people: peopleByTable.get(row.id) ?? 0,
      round1Rank: row.round1Rank,
      combinedRank: combinedRank.get(row.id) ?? null,
      wobble: row.round2Wobble,
      skipped: Boolean(row.round2Skipped),
    }));
  return {
    serviceDay,
    tables: tables.length,
    people: members.length,
    finishedTest: played.length,
    finishedTray: trayDone.length,
    inRoom: tables.filter((row) => row.status === "room").length,
    bestWobble: best.length ? Math.min(...best) : null,
    rows,
  };
}

export async function networkNightStats(serviceDay: string) {
  await ensureNightTables();
  const tables = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.serviceDay, serviceDay));
  const all = await db().select({ id: nightTables.id }).from(nightTables);
  const ids = tables.map((row) => row.id);
  const members =
    ids.length === 0
      ? []
      : await db()
          .select({ id: nightTableMembers.id })
          .from(nightTableMembers)
          .where(inArray(nightTableMembers.tableId, ids));
  const played = tables.filter((row) => pastRound1(asStatus(row.status)));
  const trayDone = tables.filter(
    (row) => row.round2Wobble != null && !row.round2Skipped,
  );
  const best = trayDone.map((row) => row.round2Wobble as number);
  return {
    tables: tables.length,
    people: members.length,
    finishedTest: played.length,
    finishedTray: trayDone.length,
    inRoom: tables.filter((row) => row.status === "room").length,
    bestWobble: best.length ? Math.min(...best) : null,
    tablesAllTime: all.length,
  };
}

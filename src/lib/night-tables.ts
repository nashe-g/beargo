import { randomInt, randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { nightTableMembers, nightTables } from "@/db/schema";
import { TABLE_CODE_LENGTH, TABLE_NAME_MAX } from "@/lib/config";
import { getTonightSlate } from "@/lib/daily-challenge";
import { serviceDayInZone } from "@/lib/dates";
import { ensureNightTables } from "@/lib/night-table-schema";
import type {
  NightTableMemberView,
  NightTableReveal,
  NightTableStatus,
  NightTableView,
} from "@/lib/night-table-types";
import type { PawRecord } from "@/lib/paws";
import { packsForNight } from "@/lib/question-packs";
import type { Question } from "@/lib/questions";
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
    raw === "revealed"
  ) {
    return raw;
  }
  return "open";
}

async function membersFor(tableId: string) {
  return db()
    .select()
    .from(nightTableMembers)
    .where(eq(nightTableMembers.tableId, tableId))
    .orderBy(asc(nightTableMembers.createdAt));
}

async function packsTonight(paw: PawRecord): Promise<Question[][]> {
  const slate = await getTonightSlate(paw.hostId, paw.timezone);
  return packsForNight(slate.questions);
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
        inArray(nightTables.status, ["revealed"]),
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

async function viewFor(
  table: typeof nightTables.$inferSelect,
  deviceKey: string | null,
  paw: PawRecord,
): Promise<NightTableView> {
  const members = await membersFor(table.id);
  const status = asStatus(table.status);
  const packs =
    status === "live" || status === "revealed" ? await packsTonight(paw) : [];
  const people = members.map((member) => personFromMember(member, packs));
  const carried =
    status === "revealed"
      ? carriedNickname(
          members.map((member, index) => ({
            nickname: member.nickname,
            ...people[index],
          })),
        )
      : null;
  const revealRows: NightTableReveal["people"] | null =
    status === "revealed"
      ? members.map((member, index) => ({
          nickname: member.nickname,
          mine: Boolean(deviceKey) && member.deviceKey === deviceKey,
          correctCount: people[index].correctCount,
          asked: people[index].asked,
          averageMs: people[index].averageMs,
          carried: carried === member.nickname,
        }))
      : null;
  const ranked =
    status === "revealed"
      ? await rankAmongTonight(paw, table.serviceDay, table.id, packs, members)
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
    correctCount: status === "revealed" ? people[index].correctCount : undefined,
    averageMs: status === "revealed" ? people[index].averageMs : undefined,
    carried:
      status === "revealed" ? carried === member.nickname : undefined,
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
      status === "revealed" && ranked && revealRows
        ? {
            correctCount: ranked.score.correctCount,
            asked: ranked.score.asked,
            averageMs: ranked.score.averageMs,
            rank: ranked.rank,
            tableCount: ranked.tableCount,
            people: revealRows,
          }
        : null,
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

  const packs = await packsTonight(input.paw);
  if (!packs.length) {
    return {
      ok: false,
      status: 409,
      error: "Tonight’s questions aren’t up yet.",
    };
  }

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
    })
    .where(eq(nightTables.id, found.table.id));

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
  if (found.table.status === "revealed") {
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

  const packs = await packsTonight(input.paw);
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
      await db()
        .update(nightTables)
        .set({ status: "revealed" satisfies NightTableStatus })
        .where(eq(nightTables.id, found.table.id));
    }
  }

  return reload(found.table.id, input.deviceKey, input.paw);
}

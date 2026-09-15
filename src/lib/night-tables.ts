import { randomInt, randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { nightTableMembers, nightTables } from "@/db/schema";
import { TABLE_CODE_LENGTH, TABLE_NAME_MAX } from "@/lib/config";
import { serviceDayInZone } from "@/lib/dates";
import { ensureNightTables } from "@/lib/night-table-schema";
import type {
  NightTableStatus,
  NightTableView,
} from "@/lib/night-table-types";
import type { PawRecord } from "@/lib/paws";
import {
  CODE_ALPHABET,
  foldKey,
  parseJoinCode,
  parseNickname,
  parseTableName,
} from "@/lib/table-copy";

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

function mapView(
  table: typeof nightTables.$inferSelect,
  members: (typeof nightTableMembers.$inferSelect)[],
  deviceKey: string | null,
  venue: string,
): NightTableView {
  return {
    id: table.id,
    name: table.name,
    joinCode: table.joinCode,
    status: table.status === "locked" ? "locked" : "open",
    serviceDay: table.serviceDay,
    venue,
    members: members.map((member) => ({
      nickname: member.nickname,
      isCreator: member.isCreator,
      mine: Boolean(deviceKey) && member.deviceKey === deviceKey,
    })),
    mineCreator: members.some(
      (member) => member.isCreator && deviceKey === member.deviceKey,
    ),
  };
}

async function membersFor(tableId: string) {
  return db()
    .select()
    .from(nightTableMembers)
    .where(eq(nightTableMembers.tableId, tableId))
    .orderBy(asc(nightTableMembers.createdAt));
}

async function viewFor(
  table: typeof nightTables.$inferSelect,
  deviceKey: string | null,
  venue: string,
) {
  return mapView(table, await membersFor(table.id), deviceKey, venue);
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
  return viewFor(hit.table, deviceKey, paw.hostDisplayName);
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
      and(
        eq(nightTables.hostId, paw.hostId),
        eq(nightTables.joinCode, code),
      ),
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
    table: await viewFor(row, deviceKey, paw.hostDisplayName),
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

  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, id))
    .limit(1);
  return {
    ok: true,
    table: await viewFor(row!, input.deviceKey, input.paw.hostDisplayName),
  };
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
  if (found.table.status === "locked") {
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

  return {
    ok: true,
    table: await viewFor(row, input.deviceKey, input.paw.hostDisplayName),
  };
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
  if (found.table.status === "locked") {
    return { ok: true, table: found.table };
  }

  await db()
    .update(nightTables)
    .set({ status: "locked", lockedAt: new Date() })
    .where(eq(nightTables.id, found.table.id));

  const [row] = await db()
    .select()
    .from(nightTables)
    .where(eq(nightTables.id, found.table.id))
    .limit(1);
  return {
    ok: true,
    table: await viewFor(row!, input.deviceKey, input.paw.hostDisplayName),
  };
}

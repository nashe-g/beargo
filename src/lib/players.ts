import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { httpCookieOptions } from "@/lib/http-cookies";
import { db } from "@/db";
import { claimLinks, players, vouchers } from "@/db/schema";
import { iso, isoRequired } from "@/lib/money";
import { normalizeEmail, normalizePhone } from "@/lib/normalize";
import { hashToken, newSecretToken } from "@/lib/tokens";

export const PLAYER_COOKIE = "beargo_player";

export type PlayerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerifiedAt?: string;
  createdAt: string;
};

function mapPlayer(row: typeof players.$inferSelect): PlayerRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    emailVerifiedAt: iso(row.emailVerifiedAt),
    createdAt: isoRequired(row.createdAt),
  };
}

export function isValidClaimContact(input: {
  fullName?: string;
  email?: string;
  phone?: string;
}) {
  const fullName = String(input.fullName ?? "").trim();
  const email = String(input.email ?? "").trim();
  const phone = normalizePhone(String(input.phone ?? ""));
  if (fullName.length < 2) return { ok: false as const, error: "Enter your name." };
  if (!email.includes("@") || email.length < 5) {
    return { ok: false as const, error: "Enter a real email." };
  }
  if (phone.length < 10) {
    return { ok: false as const, error: "Enter a phone number." };
  }
  return { ok: true as const, fullName, email, phone };
}

export async function getPlayer(id: string) {
  const [row] = await db().select().from(players).where(eq(players.id, id)).limit(1);
  return row ? mapPlayer(row) : null;
}

export async function getPlayerByEmail(email: string) {
  const [row] = await db()
    .select()
    .from(players)
    .where(eq(players.emailNormalized, normalizeEmail(email)))
    .limit(1);
  return row ? mapPlayer(row) : null;
}

export async function upsertPlayer(input: {
  fullName: string;
  email: string;
  phone: string;
}) {
  const emailNormalized = normalizeEmail(input.email);
  const phoneNormalized = normalizePhone(input.phone);
  const existing = await getPlayerByEmail(input.email);
  if (existing) {
    await db()
      .update(players)
      .set({
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        phoneNormalized,
        updatedAt: new Date(),
      })
      .where(eq(players.id, existing.id));
    return (await getPlayer(existing.id))!;
  }
  const id = randomUUID();
  await db().insert(players).values({
    id,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    emailNormalized,
    phone: input.phone.trim(),
    phoneNormalized,
  });
  return (await getPlayer(id))!;
}

export async function markPlayerVerified(playerId: string) {
  await db()
    .update(players)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(players.id, playerId));
  return getPlayer(playerId);
}

export async function listPlayers() {
  const rows = await db().select().from(players).orderBy(desc(players.createdAt));
  return rows.map(mapPlayer);
}

export async function playerClaimCount(playerId: string) {
  const rows = await db()
    .select({ id: vouchers.id })
    .from(vouchers)
    .where(eq(vouchers.playerId, playerId));
  return rows.length;
}

export async function createClaimLink(input: {
  playerId: string;
  promotionId: string;
  hostId: string;
  pawToken: string;
  sessionId?: string | null;
  deviceKey?: string | null;
}) {
  const token = newSecretToken();
  await db().insert(claimLinks).values({
    tokenHash: hashToken(token),
    playerId: input.playerId,
    promotionId: input.promotionId,
    hostId: input.hostId,
    pawToken: input.pawToken,
    sessionId: input.sessionId ?? null,
    deviceKey: input.deviceKey ?? null,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  return token;
}

export async function consumeClaimLink(token: string) {
  const hashed = hashToken(token);
  const [row] = await db()
    .select()
    .from(claimLinks)
    .where(and(eq(claimLinks.tokenHash, hashed), isNull(claimLinks.usedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return {
    tokenHash: row.tokenHash,
    playerId: row.playerId,
    promotionId: row.promotionId,
    hostId: row.hostId,
    pawToken: row.pawToken,
    sessionId: row.sessionId,
    deviceKey: row.deviceKey,
  };
}

export async function markClaimLinkUsed(tokenHash: string) {
  await db()
    .update(claimLinks)
    .set({ usedAt: new Date() })
    .where(eq(claimLinks.tokenHash, tokenHash));
}

export async function setPlayerCookie(playerId: string) {
  const jar = await cookies();
  jar.set(PLAYER_COOKIE, playerId, httpCookieOptions(60 * 60 * 24 * 400));
}

export async function playerIdFromCookies() {
  const jar = await cookies();
  return jar.get(PLAYER_COOKIE)?.value ?? null;
}

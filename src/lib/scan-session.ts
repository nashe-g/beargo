import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { CookieWriter } from "@/lib/http-cookies";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { scanSessions } from "@/db/schema";
import { localDateInZone } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";

export const DEVICE_COOKIE = "beargo_device";
export const SCAN_COOKIE = "beargo_scan";

export type SessionStamp =
  | "scanned"
  | "game_started"
  | "game_completed"
  | "teaser_shown"
  | "teaser_opened"
  | "offer_viewed"
  | "claimed";

function cookieOptions(maxAge: number) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function deviceKeyFromCookies() {
  const jar = await cookies();
  return jar.get(DEVICE_COOKIE)?.value ?? null;
}

export async function sessionIdFromCookies() {
  const jar = await cookies();
  return jar.get(SCAN_COOKIE)?.value ?? null;
}

async function cookieWriterFromHeaders(): Promise<CookieWriter> {
  const jar = await cookies();
  return {
    get: (name) => jar.get(name)?.value,
    set: (name, value, options) => {
      jar.set(name, value, options);
    },
  };
}

export async function ensureDeviceCookie(writer?: CookieWriter) {
  const jar = writer ?? (await cookieWriterFromHeaders());
  let value = jar.get(DEVICE_COOKIE);
  if (!value) {
    value = randomUUID();
    jar.set(DEVICE_COOKIE, value, cookieOptions(60 * 60 * 24 * 400));
  }
  return value;
}

export async function ensureScanSession(
  paw: PawRecord,
  extras: { promotionId?: string | null; challengeId?: string | null } = {},
  writer?: CookieWriter,
) {
  const jar = writer ?? (await cookieWriterFromHeaders());
  const deviceKey = await ensureDeviceCookie(jar);
  let sessionId = jar.get(SCAN_COOKIE);
  const localDate = localDateInZone(paw.timezone);

  if (sessionId) {
    const [existing] = await db()
      .select()
      .from(scanSessions)
      .where(eq(scanSessions.id, sessionId))
      .limit(1);
    if (existing && existing.pawToken === paw.token) {
      return existing;
    }
  }

  sessionId = randomUUID();
  await db().insert(scanSessions).values({
    id: sessionId,
    pawToken: paw.token,
    hostId: paw.hostId,
    localDate,
    challengeId: extras.challengeId ?? null,
    promotionId: extras.promotionId ?? null,
    deviceKey,
  });
  jar.set(SCAN_COOKIE, sessionId, cookieOptions(60 * 60 * 24));
  return (
    await db()
      .select()
      .from(scanSessions)
      .where(eq(scanSessions.id, sessionId))
      .limit(1)
  )[0];
}

export async function stampSession(
  sessionId: string,
  stamp: SessionStamp,
  extra: { promotionId?: string; voucherId?: string } = {},
) {
  const now = new Date();
  const patch: Partial<typeof scanSessions.$inferInsert> = { ...extra };
  if (stamp === "game_started") patch.gameStartedAt = now;
  if (stamp === "game_completed") patch.gameCompletedAt = now;
  if (stamp === "teaser_shown") patch.teaserShownAt = now;
  if (stamp === "teaser_opened") patch.teaserOpenedAt = now;
  if (stamp === "offer_viewed") patch.offerViewedAt = now;
  if (stamp === "claimed") patch.claimedAt = now;
  if (Object.keys(patch).length === 0) return;
  await db()
    .update(scanSessions)
    .set(patch)
    .where(eq(scanSessions.id, sessionId));
}

export async function sessionCountsForPromotion(promotionId: string) {
  const rows = await db()
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.promotionId, promotionId));
  return {
    scanned: rows.length,
    gamesCompleted: rows.filter((row) => row.gameCompletedAt).length,
    teasersShown: rows.filter((row) => row.teaserShownAt).length,
    teasersOpened: rows.filter((row) => row.teaserOpenedAt).length,
    offersViewed: rows.filter((row) => row.offerViewedAt).length,
    claimed: rows.filter((row) => row.claimedAt).length,
  };
}

export async function attachSessionPromotion(
  sessionId: string,
  promotionId: string | null,
) {
  if (!promotionId) return;
  await db()
    .update(scanSessions)
    .set({ promotionId })
    .where(and(eq(scanSessions.id, sessionId)));
}

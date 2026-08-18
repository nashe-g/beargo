import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
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
  | "teaser_opened"
  | "sponsor_viewed"
  | "interest"
  | "lead";

function cookieOptions(maxAge: number) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
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

export async function ensureDeviceCookie() {
  const jar = await cookies();
  let value = jar.get(DEVICE_COOKIE)?.value;
  if (!value) {
    value = randomUUID();
    jar.set(DEVICE_COOKIE, value, cookieOptions(60 * 60 * 24 * 400));
  }
  return value;
}

export async function ensureScanSession(
  paw: PawRecord,
  extras: { campaignId?: string | null; challengeId?: string | null } = {},
) {
  const jar = await cookies();
  const deviceKey = await ensureDeviceCookie();
  let sessionId = jar.get(SCAN_COOKIE)?.value;
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
    campaignId: extras.campaignId ?? null,
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
  extra: { interestId?: string; leadId?: string; campaignId?: string } = {},
) {
  const now = new Date();
  const patch: Partial<typeof scanSessions.$inferInsert> = { ...extra };
  if (stamp === "game_started") patch.gameStartedAt = now;
  if (stamp === "game_completed") patch.gameCompletedAt = now;
  if (stamp === "teaser_opened") patch.teaserOpenedAt = now;
  if (stamp === "sponsor_viewed") patch.sponsorViewedAt = now;
  if (Object.keys(patch).length === 0) return;
  await db()
    .update(scanSessions)
    .set(patch)
    .where(eq(scanSessions.id, sessionId));
}

export async function sessionCountsForCampaign(campaignId: string) {
  const rows = await db()
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.campaignId, campaignId));
  return {
    scanned: rows.length,
    gamesStarted: rows.filter((row) => row.gameStartedAt).length,
    gamesCompleted: rows.filter((row) => row.gameCompletedAt).length,
    teasers: rows.filter((row) => row.teaserOpenedAt).length,
    sponsors: rows.filter((row) => row.sponsorViewedAt).length,
  };
}

export async function attachSessionCampaign(
  sessionId: string,
  campaignId: string | null,
) {
  if (!campaignId) return;
  await db()
    .update(scanSessions)
    .set({ campaignId })
    .where(and(eq(scanSessions.id, sessionId)));
}

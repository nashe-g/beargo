import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { CookieWriter } from "@/lib/http-cookies";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { scanSessions } from "@/db/schema";
import { localDateInZone } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";
import {
  ENTRY_COOKIE,
  inferPlaySource,
  parsePlaySource,
  type PlaySource,
} from "@/lib/play-source";

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

let entrySourceColumnReady = false;

async function ensureEntrySourceColumn() {
  if (entrySourceColumnReady) return;
  await db().execute(
    sql`ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS entry_source text`,
  );
  entrySourceColumnReady = true;
}

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
  extras: {
    promotionId?: string | null;
    challengeId?: string | null;
    entrySource?: PlaySource | null;
  } = {},
  writer?: CookieWriter,
) {
  const jar = writer ?? (await cookieWriterFromHeaders());
  const deviceKey = await ensureDeviceCookie(jar);
  await ensureEntrySourceColumn();
  let sessionId = jar.get(SCAN_COOKIE);
  const localDate = localDateInZone(paw.timezone);
  const entrySource =
    extras.entrySource ??
    parsePlaySource(jar.get(ENTRY_COOKIE)) ??
    inferPlaySource(paw.token, null);

  if (!jar.get(ENTRY_COOKIE)) {
    jar.set(ENTRY_COOKIE, entrySource, cookieOptions(60 * 60 * 24));
  }

  if (sessionId) {
    const [existing] = await db()
      .select()
      .from(scanSessions)
      .where(eq(scanSessions.id, sessionId))
      .limit(1);
    if (existing && existing.pawToken === paw.token) {
      const upgradeToBar =
        extras.entrySource === "in_bar" && existing.entrySource !== "in_bar";
      if (upgradeToBar || (!existing.entrySource && entrySource)) {
        const next = upgradeToBar ? "in_bar" : entrySource;
        await db()
          .update(scanSessions)
          .set({ entrySource: next })
          .where(eq(scanSessions.id, existing.id));
        if (upgradeToBar) {
          jar.set(ENTRY_COOKIE, "in_bar", cookieOptions(60 * 60 * 24));
        }
      }
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
    entrySource,
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

export async function playSourceFromSession(
  sessionId: string | null,
  token: string,
  cookieValue?: string | null,
): Promise<PlaySource> {
  await ensureEntrySourceColumn();
  if (sessionId) {
    const [row] = await db()
      .select({ entrySource: scanSessions.entrySource })
      .from(scanSessions)
      .where(eq(scanSessions.id, sessionId))
      .limit(1);
    const fromSession = parsePlaySource(row?.entrySource);
    if (fromSession) return fromSession;
  }
  return parsePlaySource(cookieValue) ?? inferPlaySource(token, null);
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

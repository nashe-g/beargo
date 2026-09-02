import { and, eq, gte, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { scanSessions } from "@/db/schema";
import { FEED_HERE_WINDOW_MS } from "@/lib/config";
import { serviceDayWindow } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";
import { ENTRY_COOKIE, type PlaySource } from "@/lib/play-source";
import {
  SCAN_COOKIE,
  ensureEntrySourceColumn,
  playSourceFromSession,
} from "@/lib/scan-session";

export function canPostWithSource(paw: PawRecord, source: PlaySource) {
  if (paw.token === "demo") return true;
  return source === "in_bar";
}

export async function roomPlaySource(paw: PawRecord): Promise<PlaySource> {
  const jar = await cookies();
  return playSourceFromSession(
    jar.get(SCAN_COOKIE)?.value ?? null,
    paw.token,
    jar.get(ENTRY_COOKIE)?.value,
  );
}

export async function canPostToRoom(paw: PawRecord) {
  return canPostWithSource(paw, await roomPlaySource(paw));
}

export async function peopleHereTonight(paw: PawRecord) {
  await ensureEntrySourceColumn();
  const window = serviceDayWindow(paw.timezone);
  const floor = new Date(Date.now() - FEED_HERE_WINDOW_MS);
  const start = floor > window.start ? floor : window.start;
  const rows = await db()
    .select({
      deviceKey: scanSessions.deviceKey,
      entrySource: scanSessions.entrySource,
    })
    .from(scanSessions)
    .where(
      and(
        eq(scanSessions.hostId, paw.hostId),
        gte(scanSessions.scannedAt, start),
        lt(scanSessions.scannedAt, window.end),
      ),
    );
  const keys = new Set(
    rows
      .filter((row) => row.entrySource === "in_bar")
      .map((row) => row.deviceKey)
      .filter((key): key is string => Boolean(key)),
  );
  return keys.size;
}

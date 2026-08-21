import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  challengeSets,
  experienceCohorts,
  experienceSchedule,
  experiences,
} from "@/db/schema";
import { BEARGO_DAY_ZONE, GLOBAL_CHALLENGE_HOST } from "@/lib/config";
import { addCalendarDays, localDateInZone } from "@/lib/dates";
import {
  adaptationModeForSeed,
  emptyExperienceBody,
  flattenSeedForProduct,
  formatIsPlayableToday,
  liveFormat,
  stripImagesFromBody,
  type AdaptationMode,
  type ExperienceBody,
  type ExperienceRecord,
  type ExperienceStatus,
  type InspirationSeed,
} from "@/lib/experience";
import { getInspirationSeed } from "@/lib/inspiration-library";

let ensured = false;

export async function ensureExperienceTables() {
  if (ensured) return;
  await db().execute(sql`
    CREATE TABLE IF NOT EXISTS experiences (
      id text PRIMARY KEY,
      seed_id text NOT NULL,
      adaptation_mode text NOT NULL DEFAULT 'inspired',
      format text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      title text NOT NULL DEFAULT '',
      notes text,
      body jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS experience_cohorts (
      id text PRIMARY KEY,
      day_one_date text NOT NULL,
      experience_ids jsonb NOT NULL,
      published_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS experience_schedule (
      local_date text PRIMARY KEY,
      experience_id text NOT NULL REFERENCES experiences(id),
      cohort_id text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  ensured = true;
}

function asBody(value: unknown, format: string, seed?: InspirationSeed | null): ExperienceBody {
  const fallback = emptyExperienceBody(format, seed ?? undefined);
  if (!value || typeof value !== "object") return fallback;
  const row = value as Partial<ExperienceBody>;
  return stripImagesFromBody({
    title: String(row.title ?? fallback.title),
    hook: String(row.hook ?? fallback.hook),
    format: liveFormat(String(row.format ?? fallback.format)),
    estimatedDurationSeconds: Number(
      row.estimatedDurationSeconds ?? fallback.estimatedDurationSeconds,
    ),
    interactions: Array.isArray(row.interactions) ? row.interactions : [],
    payoff: row.payoff ?? fallback.payoff,
    imageBriefs: [],
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
  });
}

function mapExperience(
  row: typeof experiences.$inferSelect,
  seed?: InspirationSeed | null,
): ExperienceRecord {
  return {
    id: row.id,
    seedId: row.seedId,
    adaptationMode: row.adaptationMode as AdaptationMode,
    format: row.format,
    status: row.status as ExperienceStatus,
    title: row.title,
    notes: row.notes,
    body: asBody(row.body, row.format, seed),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getExperience(id: string) {
  await ensureExperienceTables();
  const [row] = await db()
    .select()
    .from(experiences)
    .where(eq(experiences.id, id))
    .limit(1);
  return row ? mapExperience(row, getInspirationSeed(row.seedId)) : null;
}

export async function listRecentExperiences(limit = 40) {
  await ensureExperienceTables();
  const rows = await db()
    .select()
    .from(experiences)
    .orderBy(desc(experiences.updatedAt))
    .limit(limit);
  return rows.map((row) => mapExperience(row, getInspirationSeed(row.seedId)));
}

export async function createDrafts(input: {
  seeds: { seed: InspirationSeed; adaptationMode: AdaptationMode; notes?: string }[];
}) {
  await ensureExperienceTables();
  const created: ExperienceRecord[] = [];
  for (const entry of input.seeds) {
    const seed = flattenSeedForProduct(entry.seed);
    const adaptationMode = adaptationModeForSeed(seed, entry.adaptationMode);
    const id = randomUUID();
    const body = emptyExperienceBody(seed.beargo_primary_format, seed);
    await db().insert(experiences).values({
      id,
      seedId: seed.id,
      adaptationMode,
      format: body.format,
      status: "draft",
      title: body.title,
      notes: entry.notes ?? null,
      body,
    });
    created.push((await getExperience(id))!);
  }
  return created;
}

export async function saveExperience(id: string, patch: {
  adaptationMode?: AdaptationMode;
  notes?: string | null;
  body?: ExperienceBody;
}) {
  await ensureExperienceTables();
  const current = await getExperience(id);
  if (!current) return null;
  const seed = getInspirationSeed(current.seedId);
  const body = stripImagesFromBody(patch.body ?? current.body);
  const title = body.title.trim() || current.title;
  const hasContent = body.interactions.length > 0 && body.payoff.headline.trim().length > 0;
  const adaptationMode = seed
    ? adaptationModeForSeed(seed, patch.adaptationMode ?? current.adaptationMode)
    : (patch.adaptationMode ?? current.adaptationMode);
  await db()
    .update(experiences)
    .set({
      adaptationMode,
      notes: patch.notes === undefined ? current.notes : patch.notes,
      format: body.format,
      title,
      body,
      status: current.status === "published" ? "published" : hasContent ? "ready" : "draft",
      updatedAt: new Date(),
    })
    .where(eq(experiences.id, id));
  return getExperience(id);
}

export type ScheduleRow = {
  localDate: string;
  experience: ExperienceRecord | null;
  playable: boolean;
};

export async function listSchedule(fromDate?: string, days = 14) {
  await ensureExperienceTables();
  const start = fromDate ?? localDateInZone(BEARGO_DAY_ZONE);
  const end = addCalendarDays(start, days);
  const rows = await db()
    .select()
    .from(experienceSchedule)
    .where(gte(experienceSchedule.localDate, start));
  const byDate = new Map(rows.map((row) => [row.localDate, row.experienceId]));
  const out: ScheduleRow[] = [];
  for (let i = 0; i < days; i += 1) {
    const localDate = addCalendarDays(start, i);
    if (localDate >= end) break;
    const experienceId = byDate.get(localDate);
    const experience = experienceId ? await getExperience(experienceId) : null;
    out.push({
      localDate,
      experience,
      playable: experience ? formatIsPlayableToday(experience.format) : false,
    });
  }
  return out;
}

export async function experienceForDate(localDate: string) {
  await ensureExperienceTables();
  const [row] = await db()
    .select()
    .from(experienceSchedule)
    .where(eq(experienceSchedule.localDate, localDate))
    .limit(1);
  if (!row) return null;
  return getExperience(row.experienceId);
}

export function publishBlockers(rows: ExperienceRecord[]) {
  const blockers: string[] = [];
  if (rows.length < 1 || rows.length > 7) {
    blockers.push("Publish 1 to 7 experiences.");
  }
  for (const row of rows) {
    if (row.body.interactions.length < 1) {
      blockers.push(`${row.title || row.seedId} needs interactions.`);
    }
    if (row.format === "Quick Trivia" && row.body.interactions.length < 3) {
      blockers.push(`${row.title || row.seedId} needs at least 3 trivia questions.`);
    }
    if (!row.body.payoff.headline.trim()) {
      blockers.push(`${row.title || row.seedId} needs a payoff headline.`);
    }
  }
  return blockers;
}

export async function publishCohort(experienceIds: string[]) {
  await ensureExperienceTables();
  const rows: ExperienceRecord[] = [];
  for (const id of experienceIds) {
    const row = await getExperience(id);
    if (!row) throw new Error("Experience missing.");
    rows.push(row);
  }
  const blockers = publishBlockers(rows);
  if (blockers.length > 0) {
    return { ok: false as const, blockers };
  }

  const dayOne = localDateInZone(BEARGO_DAY_ZONE);
  const cohortId = randomUUID();
  await db().insert(experienceCohorts).values({
    id: cohortId,
    dayOneDate: dayOne,
    experienceIds,
  });

  for (const [index, row] of rows.entries()) {
    const localDate = addCalendarDays(dayOne, index);
    await db()
      .insert(experienceSchedule)
      .values({
        localDate,
        experienceId: row.id,
        cohortId,
      })
      .onConflictDoUpdate({
        target: experienceSchedule.localDate,
        set: {
          experienceId: row.id,
          cohortId,
        },
      });
    await db()
      .update(experiences)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(experiences.id, row.id));
  }

  await db()
    .delete(challengeSets)
    .where(
      and(
        eq(challengeSets.hostId, GLOBAL_CHALLENGE_HOST),
        eq(challengeSets.localDate, dayOne),
      ),
    );

  return { ok: true as const, cohortId, dayOne, count: rows.length };
}

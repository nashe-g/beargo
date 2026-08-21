import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSets } from "@/db/schema";
import { listQuestions } from "@/lib/catalog";
import { BEARGO_DAY_ZONE, GLOBAL_CHALLENGE_HOST } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import {
  hydrateExperienceImages,
  type ExperienceBody,
  type ExperienceInteraction,
} from "@/lib/experience";
import { experienceForDate } from "@/lib/experience-store";
import type { PawRecord } from "@/lib/paws";
import type { Question, QuestionDifficulty } from "@/lib/questions";
import { hashSeed, mulberry32 } from "@/lib/rng";

export type TodayPlay = {
  id: string;
  localDate: string;
  experienceId: string | null;
  format: string;
  body: ExperienceBody;
  source: "scheduled" | "pool";
};

type FrozenPlay = {
  v: 2;
  experienceId: string | null;
  format: string;
  body: ExperienceBody;
  source: "scheduled" | "pool";
};

function pickOne(pool: Question[], random: () => number) {
  return pool[Math.floor(random() * pool.length)];
}

function byDifficulty(pool: Question[], difficulty: QuestionDifficulty) {
  return pool.filter((question) => question.difficulty === difficulty);
}

function draftQuestions(localDate: string, pool: Question[]): Question[] {
  const random = mulberry32(hashSeed(`${GLOBAL_CHALLENGE_HOST}:${localDate}`));
  const easy = byDifficulty(pool, "easy");
  const medium = byDifficulty(pool, "medium");
  const hard = byDifficulty(pool, "hard");
  const fallback = pool;
  const questions = [
    pickOne(easy.length ? easy : fallback, random),
    pickOne(medium.length ? medium : fallback, random),
    pickOne(hard.length ? hard : fallback, random),
  ];
  if (questions.some((question) => !question)) {
    throw new Error("Question pool is empty");
  }
  return questions;
}

function triviaBody(questions: Question[]): ExperienceBody {
  return {
    title: "Today’s BearGo",
    hook: "A short daily game.",
    format: "Quick Trivia",
    estimatedDurationSeconds: 45,
    interactions: questions.map((question) => ({
      id: question.id,
      kind: "single" as const,
      prompt: question.prompt,
      choices: question.choices,
      correctId: question.correctId,
      explanation: question.explanation,
      conversationHook: question.conversationHook,
    })),
    payoff: {
      kind: "score",
      headline: "That’s the game.",
      body: "Same one everywhere today.",
    },
    imageBriefs: [],
    warnings: [],
  };
}

function isFrozenPlay(value: unknown): value is FrozenPlay {
  if (!value || typeof value !== "object") return false;
  const row = value as FrozenPlay;
  return row.v === 2 && Boolean(row.body?.interactions);
}

function isQuestionArray(value: unknown): value is Question[] {
  return Array.isArray(value) && typeof value[0]?.prompt === "string";
}

async function freeze(localDate: string, play: Omit<TodayPlay, "id" | "localDate">, id: string) {
  const snapshot: FrozenPlay = {
    v: 2,
    experienceId: play.experienceId,
    format: play.format,
    body: play.body,
    source: play.source,
  };
  await db()
    .insert(challengeSets)
    .values({
      id,
      hostId: GLOBAL_CHALLENGE_HOST,
      localDate,
      questionIds: play.body.interactions.map((item) => item.id),
      snapshot,
    })
    .onConflictDoNothing();

  const [frozen] = await db()
    .select()
    .from(challengeSets)
    .where(
      and(
        eq(challengeSets.hostId, GLOBAL_CHALLENGE_HOST),
        eq(challengeSets.localDate, localDate),
      ),
    )
    .limit(1);

  if (frozen && isFrozenPlay(frozen.snapshot)) {
    return {
      id: frozen.id,
      localDate,
      experienceId: frozen.snapshot.experienceId,
      format: frozen.snapshot.format,
      body: frozen.snapshot.body,
      source: frozen.snapshot.source,
    };
  }
  if (frozen && isQuestionArray(frozen.snapshot)) {
    return {
      id: frozen.id,
      localDate,
      experienceId: null,
      format: "Quick Trivia",
      body: triviaBody(frozen.snapshot),
      source: "pool" as const,
    };
  }
  return { id, localDate, ...play };
}

export async function getTodayPlay(at = new Date()): Promise<TodayPlay> {
  const localDate = localDateInZone(BEARGO_DAY_ZONE, at);
  const [existing] = await db()
    .select()
    .from(challengeSets)
    .where(
      and(
        eq(challengeSets.hostId, GLOBAL_CHALLENGE_HOST),
        eq(challengeSets.localDate, localDate),
      ),
    )
    .limit(1);

  if (existing && isFrozenPlay(existing.snapshot)) {
    return {
      id: existing.id,
      localDate,
      experienceId: existing.snapshot.experienceId,
      format: existing.snapshot.format,
      body: existing.snapshot.body,
      source: existing.snapshot.source,
    };
  }
  if (existing && isQuestionArray(existing.snapshot)) {
    return {
      id: existing.id,
      localDate,
      experienceId: null,
      format: "Quick Trivia",
      body: triviaBody(existing.snapshot),
      source: existing.id.startsWith("exp:") ? "scheduled" : "pool",
    };
  }

  const scheduled = await experienceForDate(localDate);
  if (scheduled && scheduled.body.interactions.length >= 1) {
    return freeze(
      localDate,
      {
        experienceId: scheduled.id,
        format: scheduled.format,
        body: hydrateExperienceImages(scheduled.body),
        source: "scheduled",
      },
      `exp:${scheduled.id}:${localDate}`,
    );
  }

  const questions = draftQuestions(localDate, await listQuestions());
  return freeze(
    localDate,
    {
      experienceId: null,
      format: "Quick Trivia",
      body: triviaBody(questions),
      source: "pool",
    },
    `${GLOBAL_CHALLENGE_HOST}:${localDate}`,
  );
}

export async function playForPaw(_paw: PawRecord, at = new Date()) {
  return getTodayPlay(at);
}

export async function getDailyChallenge(at = new Date()) {
  const play = await getTodayPlay(at);
  return {
    id: play.id,
    localDate: play.localDate,
    questions: play.body.interactions.map((item: ExperienceInteraction, index) => ({
      id: item.id || `q${index + 1}`,
      prompt: item.prompt,
      choices: item.choices ?? [],
      correctId: item.correctId ?? "",
      explanation: item.explanation ?? "",
      difficulty: "medium" as const,
      conversationHook: item.conversationHook,
    })),
    source: play.source,
  };
}

export async function challengeForPaw(paw: PawRecord, at = new Date()) {
  return getDailyChallenge(at);
}

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSets } from "@/db/schema";
import { listQuestions } from "@/lib/catalog";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";
import { getPublishedSlate } from "@/lib/question-slate-store";
import {
  QUESTIONS_PER_CHALLENGE,
  type Question,
  type QuestionDifficulty,
} from "@/lib/questions";
import { hashSeed, mulberry32 } from "@/lib/rng";

export type DailyChallenge = {
  id: string;
  localDate: string;
  questions: Question[];
  source: "network" | "host";
};

export type ChallengeAnswer = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

function pickOne(pool: Question[], random: () => number) {
  return pool[Math.floor(random() * pool.length)];
}

function byDifficulty(pool: Question[], difficulty: QuestionDifficulty) {
  return pool.filter((question) => question.difficulty === difficulty);
}

function draftSet(hostId: string, localDate: string, pool: Question[]): Question[] {
  const random = mulberry32(hashSeed(`${hostId}:${localDate}`));
  const easy = byDifficulty(pool, "easy");
  const medium = byDifficulty(pool, "medium");
  const hard = byDifficulty(pool, "hard");
  const fallback = pool.length > 0 ? pool : [];
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

export async function getDailyChallenge(
  hostId: string,
  timezone: string,
  at = new Date(),
): Promise<DailyChallenge> {
  const networkDate = localDateInZone(BEARGO_DAY_ZONE, at);
  const networkQuestions = await getPublishedSlate(networkDate);
  if (networkQuestions) {
    return {
      id: `${hostId}:${networkDate}`,
      localDate: networkDate,
      questions: networkQuestions,
      source: "network",
    };
  }

  const localDate = localDateInZone(timezone, at);
  const id = `${hostId}:${localDate}`;

  const [existing] = await db()
    .select()
    .from(challengeSets)
    .where(
      and(eq(challengeSets.hostId, hostId), eq(challengeSets.localDate, localDate)),
    )
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      localDate: existing.localDate,
      questions: existing.snapshot as Question[],
      source: "host",
    };
  }

  const pool = await listQuestions();
  const questions = draftSet(hostId, localDate, pool);

  await db()
    .insert(challengeSets)
    .values({
      id,
      hostId,
      localDate,
      questionIds: questions.map((question) => question.id),
      snapshot: questions,
    })
    .onConflictDoNothing();

  const [frozen] = await db()
    .select()
    .from(challengeSets)
    .where(
      and(eq(challengeSets.hostId, hostId), eq(challengeSets.localDate, localDate)),
    )
    .limit(1);

  return {
    id: frozen?.id ?? id,
    localDate,
    questions: (frozen?.snapshot as Question[] | undefined) ?? questions,
    source: "host",
  };
}

export async function challengeForPaw(paw: PawRecord, at = new Date()) {
  return getDailyChallenge(paw.hostId, paw.timezone, at);
}

export function scoreChallenge(
  challenge: DailyChallenge,
  answers: ChallengeAnswer[],
) {
  if (answers.length !== QUESTIONS_PER_CHALLENGE) {
    return null;
  }

  const seen = new Set<string>();
  let correctCount = 0;
  let totalResponseMs = 0;

  for (const answer of answers) {
    const question = challenge.questions.find((row) => row.id === answer.questionId);
    if (
      !question ||
      seen.has(answer.questionId) ||
      question.choices.every((choice) => choice.id !== answer.choiceId) ||
      !Number.isFinite(answer.responseMs) ||
      answer.responseMs < 0
    ) {
      return null;
    }
    seen.add(answer.questionId);
    if (answer.choiceId === question.correctId) correctCount += 1;
    totalResponseMs += answer.responseMs;
  }

  if (challenge.questions.some((question) => !seen.has(question.id))) {
    return null;
  }

  return {
    challengeId: challenge.id,
    correctCount,
    totalResponseMs: Math.round(totalResponseMs),
  };
}

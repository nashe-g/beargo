import { hashSeed, mulberry32 } from "@/lib/rng";
import type { Question } from "@/lib/questions";

export const MISS_MS = 20_000;
export const MAX_RESPONSE_MS = 120_000;

export type TableAnswer = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

export type PersonScore = {
  correctCount: number;
  asked: number;
  averageMs: number;
};

export type TableScore = {
  correctCount: number;
  asked: number;
  correctRate: number;
  averageMs: number;
};

export type PublicQuestion = {
  id: string;
  prompt: string;
  choices: { id: string; label: string }[];
  difficulty: Question["difficulty"];
};

export function effectiveMs(correct: boolean, responseMs: number) {
  if (!correct) return MISS_MS;
  if (!Number.isFinite(responseMs) || responseMs < 0) return 0;
  return Math.round(responseMs);
}

export function asTableAnswers(value: unknown): TableAnswer[] {
  if (!Array.isArray(value)) return [];
  const answers: TableAnswer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.questionId !== "string" || typeof row.choiceId !== "string") {
      continue;
    }
    const responseMs = Number(row.responseMs);
    if (!Number.isFinite(responseMs) || responseMs < 0) continue;
    answers.push({
      questionId: row.questionId,
      choiceId: row.choiceId,
      responseMs: Math.min(MAX_RESPONSE_MS, Math.round(responseMs)),
    });
  }
  return answers;
}

export function scorePerson(
  questions: { id: string; correctId: string }[],
  answers: TableAnswer[],
): PersonScore {
  const asked = questions.length;
  let correctCount = 0;
  let total = 0;
  for (const question of questions) {
    const answer = answers.find((row) => row.questionId === question.id);
    const correct = Boolean(answer && answer.choiceId === question.correctId);
    if (correct) correctCount += 1;
    total += effectiveMs(correct, answer?.responseMs ?? MISS_MS);
  }
  return {
    correctCount,
    asked,
    averageMs: asked ? total / asked : 0,
  };
}

export function scoreTable(people: PersonScore[]): TableScore {
  const asked = people.reduce((sum, person) => sum + person.asked, 0);
  const correctCount = people.reduce((sum, person) => sum + person.correctCount, 0);
  const averageMs = people.length
    ? people.reduce((sum, person) => sum + person.averageMs, 0) / people.length
    : 0;
  return {
    correctCount,
    asked,
    correctRate: asked ? correctCount / asked : 0,
    averageMs,
  };
}

export function compareTableScores(left: TableScore, right: TableScore) {
  if (left.correctRate !== right.correctRate) {
    return right.correctRate - left.correctRate;
  }
  return left.averageMs - right.averageMs;
}

export function comparePersonScores(left: PersonScore, right: PersonScore) {
  if (left.correctCount !== right.correctCount) {
    return right.correctCount - left.correctCount;
  }
  return left.averageMs - right.averageMs;
}

export function assignPackIndexes(
  memberCount: number,
  packCount: number,
  seed: string,
) {
  if (memberCount < 1 || packCount < 1) return [];
  const packs = Array.from({ length: packCount }, (_, index) => index);
  const random = mulberry32(hashSeed(`packs:${seed}`));
  for (let i = packs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = packs[i];
    packs[i] = packs[j];
    packs[j] = swap;
  }
  return Array.from(
    { length: memberCount },
    (_, index) => packs[index % packCount],
  );
}

export function publicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
    })),
    difficulty: question.difficulty,
  };
}

export function formatSeconds(ms: number) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)} sec`;
}

export function waitingOnLine(names: string[]) {
  if (names.length === 0) return "You did your part.";
  if (names.length === 1) return `You did your part. Waiting on ${names[0]}…`;
  if (names.length === 2) {
    return `You did your part. Waiting on ${names[0]} and ${names[1]}…`;
  }
  return `You did your part. Waiting on ${names[0]}, ${names[1]}, and ${names.length - 2} more…`;
}

export function carriedNickname(
  people: Array<{ nickname: string } & PersonScore>,
) {
  if (people.length === 0) return null;
  const ranked = [...people].sort(comparePersonScores);
  const lead = ranked[0];
  const tied =
    ranked.length > 1 && comparePersonScores(ranked[0], ranked[1]) === 0;
  if (tied) return null;
  return lead.nickname;
}

export function parseResponseMs(raw: unknown) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.min(MAX_RESPONSE_MS, Math.round(value));
}

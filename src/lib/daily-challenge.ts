import { localDateInZone } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";
import {
  QUESTION_POOL,
  QUESTIONS_PER_CHALLENGE,
  type Question,
  type QuestionDifficulty,
} from "@/lib/questions";
import { hashSeed, mulberry32 } from "@/lib/rng";

export type DailyChallenge = {
  id: string;
  localDate: string;
  questions: Question[];
};

export type ChallengeAnswer = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

function pickOne(questions: Question[], random: () => number) {
  return questions[Math.floor(random() * questions.length)];
}

function byDifficulty(difficulty: QuestionDifficulty) {
  return QUESTION_POOL.filter((question) => question.difficulty === difficulty);
}

export function getDailyChallenge(
  hostId: string,
  timezone: string,
  at = new Date(),
): DailyChallenge {
  const localDate = localDateInZone(timezone, at);
  const id = `${hostId}:${localDate}`;
  const random = mulberry32(hashSeed(id));

  return {
    id,
    localDate,
    questions: [
      pickOne(byDifficulty("easy"), random),
      pickOne(byDifficulty("medium"), random),
      pickOne(byDifficulty("hard"), random),
    ],
  };
}

export function challengeForPaw(paw: PawRecord, at = new Date()) {
  return getDailyChallenge(paw.hostId, paw.timezone, at);
}

export function scoreChallenge(
  challenge: DailyChallenge,
  answers: ChallengeAnswer[],
) {
  if (answers.length !== QUESTIONS_PER_CHALLENGE) {
    return null;
  }

  let correctCount = 0;
  let totalResponseMs = 0;

  for (const [index, question] of challenge.questions.entries()) {
    const answer = answers[index];
    if (
      !answer ||
      answer.questionId !== question.id ||
      question.choices.every((choice) => choice.id !== answer.choiceId) ||
      !Number.isFinite(answer.responseMs) ||
      answer.responseMs < 0
    ) {
      return null;
    }

    if (answer.choiceId === question.correctId) correctCount += 1;
    totalResponseMs += answer.responseMs;
  }

  return {
    challengeId: challenge.id,
    correctCount,
    totalResponseMs: Math.round(totalResponseMs),
  };
}

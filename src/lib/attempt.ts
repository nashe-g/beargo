import { liveSkill, liveSkillPath } from "@/lib/config";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";

export type AttemptAnswer = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

export type AttemptSnapshot = {
  correctCount: number;
  totalResponseMs: number;
  pourMg?: number;
  stackWobble?: number;
  rank?: number;
  playerCount?: number;
  playersBeaten?: number;
  finishedAt: number;
  answers?: AttemptAnswer[];
};

function storageKey(token: string) {
  return `beargo:attempt:${token}`;
}

export function saveAttempt(token: string, attempt: AttemptSnapshot) {
  sessionStorage.setItem(storageKey(token), JSON.stringify(attempt));
}

export function loadAttempt(token: string): AttemptSnapshot | null {
  const raw = sessionStorage.getItem(storageKey(token));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AttemptSnapshot;
    if (
      typeof parsed.correctCount !== "number" ||
      typeof parsed.totalResponseMs !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function attemptNeedsSkill(attempt: AttemptSnapshot | null) {
  if (!attempt?.answers) return false;
  if (attempt.answers.length < QUESTIONS_PER_CHALLENGE) return false;
  const skill = liveSkill();
  if (skill === "stack") return attempt.stackWobble == null;
  if (skill === "pour") return attempt.pourMg == null;
  return false;
}

export function attemptNeedsPour(attempt: AttemptSnapshot | null) {
  return liveSkill() === "pour" && attemptNeedsSkill(attempt);
}

export function skillHref(token: string) {
  return liveSkillPath(token);
}

export function formatDuration(ms: number) {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)} sec`;
}

export function beatCopy(playersBeaten: number, playerCount: number) {
  if (playerCount <= 1) return "First on the board today.";
  if (playersBeaten === 1) return "You beat 1 player.";
  return `You beat ${playersBeaten} players.`;
}

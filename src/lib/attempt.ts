import {
  attemptNeedsHands,
  nextPlayPath,
} from "@/lib/play-rounds";

export type AttemptAnswer = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

export type AttemptSnapshot = {
  correctCount: number;
  totalResponseMs: number;
  pourMg?: number;
  pourFills?: number[];
  /** Total wobble in tenths, matching the DB column. */
  stackWobble?: number;
  /** Per-carry wobble, one decimal. */
  carryWobbles?: number[];
  /** Best wobbles on tonight's board (tenths), for the mini leaderboard. */
  topWobbles?: number[];
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
  return attemptNeedsHands(attempt);
}

export { attemptNeedsPour, attemptNeedsStack } from "@/lib/play-rounds";

export function skillHref(token: string, attempt?: AttemptSnapshot | null) {
  return nextPlayPath(token, attempt ?? null);
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


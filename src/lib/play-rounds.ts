import { POUR_ENABLED, STACK_ENABLED } from "@/lib/config";
import type { AttemptSnapshot } from "@/lib/attempt";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";

export type PlayRoundId = "trivia" | "pour" | "stack";

export type PlayRoundCopy = {
  id: PlayRoundId;
  n: string;
  name: string;
  title: string;
  tease: string;
  body: string;
  cta: string;
};

export const PLAY_HOOK = {
  kicker: "How steady are you tonight.",
  title: "Head. Hands. Nerves.",
  body: "Three tests. Two minutes. Brain first, then a pour, then you walk the tray. Same table. Pass the phone when you’re done.",
  cta: "Let’s go",
} as const;

export const PLAY_ROUNDS: Record<PlayRoundId, PlayRoundCopy> = {
  trivia: {
    id: "trivia",
    n: "01",
    name: "The brain",
    title: "Three questions.",
    tease: "Talk it out if you want.",
    body: "Same ones for everyone here today. Wrong is still a story. Hands and the tray wait.",
    cta: "Start the brain",
  },
  pour: {
    id: "pour",
    n: "02",
    name: "The pour",
    title: "Your hands.",
    tease: "Hold to the mark.",
    body: "Three glasses. Hold to the line. Let go — the stream still lands and the head settles. That’s the test.",
    cta: "Pour it",
  },
  stack: {
    id: "stack",
    n: "03",
    name: "The tray",
    title: "Last one. Don’t drop it.",
    tease: "Friends will watch.",
    body: "It leans on its own. Tap the arrow on the side it’s falling. Three carries. Don’t make them mop.",
    cta: "Carry it",
  },
};

export function playRoundList() {
  const rows: PlayRoundCopy[] = [PLAY_ROUNDS.trivia];
  if (POUR_ENABLED) rows.push(PLAY_ROUNDS.pour);
  if (STACK_ENABLED) rows.push(PLAY_ROUNDS.stack);
  return rows.map((row, index) => ({
    ...row,
    n: String(index + 1).padStart(2, "0"),
  }));
}

function answersReady(attempt: AttemptSnapshot | null) {
  return (attempt?.answers?.length ?? 0) >= QUESTIONS_PER_CHALLENGE;
}

export function attemptNeedsPour(attempt: AttemptSnapshot | null) {
  if (!POUR_ENABLED || !answersReady(attempt)) return false;
  return attempt?.pourFills == null && attempt?.pourMg == null;
}

export function attemptNeedsStack(attempt: AttemptSnapshot | null) {
  if (!STACK_ENABLED || !answersReady(attempt)) return false;
  if (POUR_ENABLED && attemptNeedsPour(attempt)) return false;
  return attempt?.stackWobble == null;
}

export function attemptNeedsHands(attempt: AttemptSnapshot | null) {
  return attemptNeedsPour(attempt) || attemptNeedsStack(attempt);
}

export function nextPlayPath(token: string, attempt: AttemptSnapshot | null) {
  const base = `/p/${encodeURIComponent(token)}`;
  if (!answersReady(attempt)) return `${base}/play`;
  if (attemptNeedsPour(attempt)) return `${base}/pour`;
  if (attemptNeedsStack(attempt)) return `${base}/stack`;
  return `${base}/result`;
}

export function nextHandsCta(attempt: AttemptSnapshot | null) {
  if (attemptNeedsPour(attempt)) return PLAY_ROUNDS.pour.cta;
  if (attemptNeedsStack(attempt)) return PLAY_ROUNDS.stack.cta;
  return "See rank";
}

export function afterTriviaLine() {
  if (POUR_ENABLED) return "Brain’s in. Hands next.";
  if (STACK_ENABLED) return "Brain’s in. Tray next.";
  return "That’s the set.";
}

export function afterPourLine() {
  if (STACK_ENABLED) return "Hands are warm. One more — the tray.";
  return "That’s the set.";
}

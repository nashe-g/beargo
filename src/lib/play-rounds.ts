import { POUR_ENABLED, STACK_ENABLED, TRIVIA_ENABLED } from "@/lib/config";
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

export const PLAY_ROUNDS: Record<PlayRoundId, PlayRoundCopy> = {
  stack: {
    id: "stack",
    n: "01",
    name: "The tray",
    title: "Don’t drop the drinks.",
    tease: "Keep the glasses from falling.",
    body: "The glasses lean on their own. Tap the side they’re falling. Three carries.",
    cta: "Carry it",
  },
  trivia: {
    id: "trivia",
    n: "02",
    name: "Trivia",
    title: "Beat the room.",
    tease: "Same three for everyone here.",
    body: "3 curious questions. Same ones as everyone here tonight.",
    cta: "Ask me",
  },
  pour: {
    id: "pour",
    n: "03",
    name: "The pour",
    title: "Now, the pour.",
    tease: "Fill three glasses to the line.",
    body: "Three glasses. Hold to the gold line, then let go.",
    cta: "Pour it",
  },
};

export function playRoundList() {
  const rows: PlayRoundCopy[] = [];
  if (STACK_ENABLED) rows.push(PLAY_ROUNDS.stack);
  if (TRIVIA_ENABLED) rows.push(PLAY_ROUNDS.trivia);
  if (POUR_ENABLED) rows.push(PLAY_ROUNDS.pour);
  return rows.map((row, index) => ({
    ...row,
    n: String(index + 1).padStart(2, "0"),
  }));
}

export function answersReady(attempt: AttemptSnapshot | null) {
  if (!TRIVIA_ENABLED) return true;
  return (attempt?.answers?.length ?? 0) >= QUESTIONS_PER_CHALLENGE;
}

export function attemptNeedsStack(attempt: AttemptSnapshot | null) {
  if (!STACK_ENABLED) return false;
  return attempt?.stackWobble == null;
}

export function attemptNeedsPour(attempt: AttemptSnapshot | null) {
  if (!POUR_ENABLED || !answersReady(attempt)) return false;
  return attempt?.pourFills == null && attempt?.pourMg == null;
}

export function attemptNeedsTrivia(attempt: AttemptSnapshot | null) {
  if (!TRIVIA_ENABLED) return false;
  return !answersReady(attempt);
}

export function attemptNeedsHands(attempt: AttemptSnapshot | null) {
  return attemptNeedsPour(attempt) || attemptNeedsStack(attempt);
}

export function nextPlayPath(token: string, attempt: AttemptSnapshot | null) {
  const base = `/p/${encodeURIComponent(token)}`;
  if (attemptNeedsStack(attempt)) return `${base}/stack`;
  if (attemptNeedsTrivia(attempt)) return `${base}/play`;
  if (attemptNeedsPour(attempt)) return `${base}/pour`;
  return `${base}/result`;
}

export function afterTriviaRoast(
  correct: number,
  total = QUESTIONS_PER_CHALLENGE,
) {
  if (correct >= total) return "Three for three. Don’t get cute.";
  if (correct === 2) return "Two. We’ll allow it.";
  if (correct === 1) return "One. The tray still counts.";
  return "Zero. The tray has to carry you.";
}

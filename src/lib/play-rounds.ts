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

export const PLAY_HOOK = {
  title: "Who’s still got it?",
  body: "Three bar questions. Pour three beers to the line. Keep a leaning tray of glasses up. Two minutes. Rank at this bar today.",
  dare: "Dare the person next to you to play too.",
  cta: "Let’s go",
} as const;

export const PLAY_ROUNDS: Record<PlayRoundId, PlayRoundCopy> = {
  trivia: {
    id: "trivia",
    n: "01",
    name: "Trivia",
    title: "Three bar questions.",
    tease: "Same ones for everyone here.",
    body: "Same three for everyone at this bar today.",
    cta: "Start",
  },
  pour: {
    id: "pour",
    n: "02",
    name: "The pour",
    title: "Now, the pour.",
    tease: "Fill three glasses to the line.",
    body: "Three glasses. Hold to the gold line, then let go.",
    cta: "Pour it",
  },
  stack: {
    id: "stack",
    n: "03",
    name: "The tray",
    title: "Last one. Don’t drop it.",
    tease: "Keep the glasses from falling.",
    body: "The glasses lean on their own. Tap the arrow on the side they’re falling. Three carries. Don’t make them mop.",
    cta: "Carry it",
  },
};

export function playRoundList() {
  const rows: PlayRoundCopy[] = [];
  if (TRIVIA_ENABLED) rows.push(PLAY_ROUNDS.trivia);
  if (POUR_ENABLED) rows.push(PLAY_ROUNDS.pour);
  if (STACK_ENABLED) rows.push(PLAY_ROUNDS.stack);
  return rows.map((row, index) => ({
    ...row,
    n: String(index + 1).padStart(2, "0"),
  }));
}

function answersReady(attempt: AttemptSnapshot | null) {
  if (!TRIVIA_ENABLED) return true;
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
  if (TRIVIA_ENABLED && !answersReady(attempt)) return `${base}/play`;
  if (attemptNeedsPour(attempt)) return `${base}/pour`;
  if (attemptNeedsStack(attempt)) return `${base}/stack`;
  return `${base}/result`;
}

export function nextHandsCta(attempt: AttemptSnapshot | null) {
  if (attemptNeedsPour(attempt)) return PLAY_ROUNDS.pour.cta;
  if (attemptNeedsStack(attempt)) return PLAY_ROUNDS.stack.cta;
  return "See rank";
}

export function afterTriviaRoast(
  correct: number,
  total = QUESTIONS_PER_CHALLENGE,
) {
  if (correct >= total) return "Three for three. Don’t get cute.";
  if (correct === 2) return "Two. We’ll allow it.";
  if (correct === 1) return "One. The pour might save you.";
  return "Zero. At least you’re honest.";
}

export type AttemptAnswer = {
  interactionId: string;
  choiceIds: string[];
  text?: string;
  order?: string[];
  responseMs: number;
  questionId?: string;
  choiceId?: string;
};

export type AttemptSnapshot = {
  format: string;
  correctCount: number;
  questionCount: number;
  totalResponseMs: number;
  finishedAt: number;
  headline: string;
  body: string;
  scoreLine?: string;
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
    const parsed = JSON.parse(raw) as AttemptSnapshot & {
      rank?: number;
    };
    if (typeof parsed.totalResponseMs !== "number") return null;
    return {
      format: parsed.format || "Quick Trivia",
      correctCount: parsed.correctCount ?? 0,
      questionCount:
        typeof parsed.questionCount === "number" && parsed.questionCount > 0
          ? parsed.questionCount
          : parsed.answers?.length || 3,
      totalResponseMs: parsed.totalResponseMs,
      finishedAt: parsed.finishedAt,
      headline: parsed.headline || "",
      body: parsed.body || "",
      scoreLine: parsed.scoreLine,
      answers: parsed.answers,
    };
  } catch {
    return null;
  }
}

export function formatDuration(ms: number) {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)} sec`;
}

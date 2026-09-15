import {
  NIGHT_PACKS,
  NIGHT_SLATE_SIZE,
  QUESTIONS_PER_CHALLENGE,
  type Question,
  type QuestionDifficulty,
} from "@/lib/questions";

export { NIGHT_PACKS, NIGHT_SLATE_SIZE, QUESTIONS_PER_CHALLENGE };

const DIFFICULTIES: QuestionDifficulty[] = ["easy", "medium", "hard"];

export function asQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Question => {
    if (!item || typeof item !== "object") return false;
    const row = item as Question;
    return Boolean(row.id && row.prompt && Array.isArray(row.choices));
  });
}

export function isFullNightSlate(questions: Question[]) {
  return questions.length === NIGHT_SLATE_SIZE;
}

export function chunkNightPacks(questions: Question[]): Question[][] {
  const packs: Question[][] = [];
  for (let index = 0; index < questions.length; index += QUESTIONS_PER_CHALLENGE) {
    packs.push(questions.slice(index, index + QUESTIONS_PER_CHALLENGE));
  }
  return packs;
}

export function nightPacksFromSlate(questions: Question[]): Question[][] | null {
  if (!isFullNightSlate(questions)) return null;
  return Array.from({ length: NIGHT_PACKS }, (_, pack) =>
    questions.slice(
      pack * QUESTIONS_PER_CHALLENGE,
      (pack + 1) * QUESTIONS_PER_CHALLENGE,
    ),
  );
}

/** Full 21 → seven packs. A leftover 3-question night stays one shared pack. */
export function packsForNight(questions: Question[]): Question[][] {
  const full = nightPacksFromSlate(questions);
  if (full) return full;
  if (questions.length >= QUESTIONS_PER_CHALLENGE) {
    return [questions.slice(0, QUESTIONS_PER_CHALLENGE)];
  }
  return [];
}

export function slateQuestionId(
  localDate: string,
  pack: number,
  difficulty: QuestionDifficulty,
) {
  return `slate-${localDate}-p${pack}-${difficulty}`;
}

export function countByDifficulty(questions: Question[]) {
  const counts: Record<QuestionDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  for (const question of questions) {
    if (question.difficulty in counts) counts[question.difficulty] += 1;
  }
  return counts;
}

export function takePacksFromDrafts(
  localDate: string,
  drafts: {
    prompt: string;
    choices: { id: string; label: string }[];
    correctId: string;
    explanation: string;
    difficulty: string;
    category?: string;
    conversationHook?: string;
  }[],
): { ok: true; questions: Question[] } | { ok: false; missing: QuestionDifficulty[] } {
  const buckets: Record<QuestionDifficulty, typeof drafts> = {
    easy: [],
    medium: [],
    hard: [],
  };
  for (const draft of drafts) {
    const difficulty = draft.difficulty as QuestionDifficulty;
    if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
      buckets[difficulty].push(draft);
    }
  }
  const missing = DIFFICULTIES.filter(
    (difficulty) => buckets[difficulty].length < NIGHT_PACKS,
  );
  if (missing.length) return { ok: false, missing };

  const questions: Question[] = [];
  for (let pack = 0; pack < NIGHT_PACKS; pack += 1) {
    for (const difficulty of DIFFICULTIES) {
      const draft = buckets[difficulty][pack];
      questions.push({
        id: slateQuestionId(localDate, pack, difficulty),
        prompt: draft.prompt.trim(),
        choices: draft.choices.map((choice) => ({
          id: choice.id,
          label: choice.label.trim(),
        })),
        correctId: draft.correctId,
        explanation: draft.explanation.trim(),
        difficulty,
        category: draft.category ?? "general",
        conversationHook: draft.conversationHook?.trim() || undefined,
      });
    }
  }
  return { ok: true, questions };
}

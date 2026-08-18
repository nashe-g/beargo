import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questionCandidates, questionReports, questions } from "@/db/schema";
import { insertApprovedQuestion } from "@/lib/catalog";
import { isoRequired } from "@/lib/money";
import type { QuestionDifficulty } from "@/lib/questions";
import { slugify } from "@/lib/slug";

const SPONSOR_WORDS = [
  "jobradar",
  "hoplist",
  "nightowl",
  "campusbite",
  "beargo",
];

export type CandidateDraft = {
  prompt: string;
  choices: { id: string; label: string }[];
  correctId: string;
  explanation: string;
  difficulty: string;
  category?: string;
  conversationHook?: string;
  sourceNotes?: string;
};

export type QuestionCandidate = {
  id: string;
  prompt: string;
  choices: { id: string; label: string }[];
  correctId: string | null;
  explanation: string | null;
  difficulty: string | null;
  category: string;
  conversationHook: string | null;
  sourceNotes: string | null;
  generationModel: string | null;
  promptVersion: string | null;
  verificationStatus: string;
  validationErrors: string[];
  createdAt: string;
};

function normalizePrompt(prompt: string) {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateQuestionDraft(draft: CandidateDraft): string[] {
  const errors: string[] = [];
  const prompt = draft.prompt?.trim() ?? "";
  if (prompt.length < 12) errors.push("Prompt is too short.");
  if (prompt.length > 240) errors.push("Prompt is too long.");
  if (!Array.isArray(draft.choices) || draft.choices.length !== 4) {
    errors.push("Exactly four choices are required.");
  }
  const ids = (draft.choices ?? []).map((choice) => choice.id);
  if (ids.sort().join("") !== "abcd") {
    errors.push("Choices must use ids a, b, c, and d.");
  }
  const labels = (draft.choices ?? []).map((choice) => choice.label?.trim() ?? "");
  if (labels.some((label) => label.length < 1)) {
    errors.push("Every choice needs a label.");
  }
  if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
    errors.push("Choices must be unique.");
  }
  if (!["a", "b", "c", "d"].includes(draft.correctId)) {
    errors.push("correctId must be a, b, c, or d.");
  }
  if (!["easy", "medium", "hard"].includes(draft.difficulty)) {
    errors.push("Difficulty must be easy, medium, or hard.");
  }
  if (!draft.explanation?.trim() || draft.explanation.trim().length < 8) {
    errors.push("Explanation is missing.");
  }
  const blob = `${prompt} ${labels.join(" ")} ${draft.explanation ?? ""}`.toLowerCase();
  if (SPONSOR_WORDS.some((word) => blob.includes(word))) {
    errors.push("Question looks promotional or mentions BearGo/sponsors.");
  }
  if (/\b(best|should you)\b/i.test(prompt) && /app|brand|product/i.test(prompt)) {
    errors.push("Question looks like a disguised ad.");
  }
  return errors;
}

export async function isDuplicatePrompt(prompt: string) {
  const needle = normalizePrompt(prompt);
  const [pool, queue] = await Promise.all([
    db().select({ prompt: questions.prompt }).from(questions),
    db().select({ prompt: questionCandidates.prompt }).from(questionCandidates),
  ]);
  return [...pool, ...queue].some(
    (row) => normalizePrompt(row.prompt) === needle,
  );
}

export function mapCandidate(
  row: typeof questionCandidates.$inferSelect,
): QuestionCandidate {
  return {
    id: row.id,
    prompt: row.prompt,
    choices: row.choices,
    correctId: row.correctId,
    explanation: row.explanation,
    difficulty: row.difficulty,
    category: row.category,
    conversationHook: row.conversationHook,
    sourceNotes: row.sourceNotes,
    generationModel: row.generationModel,
    promptVersion: row.promptVersion,
    verificationStatus: row.verificationStatus,
    validationErrors: row.validationErrors ?? [],
    createdAt: isoRequired(row.createdAt),
  };
}

export async function listCandidates(status?: string) {
  const rows = status
    ? await db()
        .select()
        .from(questionCandidates)
        .where(eq(questionCandidates.verificationStatus, status))
        .orderBy(desc(questionCandidates.createdAt))
    : await db()
        .select()
        .from(questionCandidates)
        .orderBy(desc(questionCandidates.createdAt));
  return rows.map(mapCandidate);
}

export async function enqueueCandidate(
  draft: CandidateDraft,
  meta: { model?: string; promptVersion?: string } = {},
) {
  const errors = validateQuestionDraft(draft);
  if (await isDuplicatePrompt(draft.prompt)) {
    errors.push("Duplicate of an existing question or candidate.");
  }
  const id = `${slugify(draft.prompt.slice(0, 40))}-${randomUUID().slice(0, 8)}`;
  await db().insert(questionCandidates).values({
    id,
    prompt: draft.prompt.trim(),
    choices: draft.choices,
    correctId: draft.correctId,
    explanation: draft.explanation?.trim() ?? null,
    difficulty: draft.difficulty,
    category: draft.category ?? "general",
    conversationHook: draft.conversationHook ?? null,
    sourceNotes: draft.sourceNotes ?? null,
    generationModel: meta.model ?? null,
    promptVersion: meta.promptVersion ?? "v1",
    verificationStatus: errors.length ? "invalid" : "needs_review",
    validationErrors: errors,
  });
  const [row] = await db()
    .select()
    .from(questionCandidates)
    .where(eq(questionCandidates.id, id))
    .limit(1);
  return mapCandidate(row!);
}

export async function approveCandidate(id: string) {
  const [row] = await db()
    .select()
    .from(questionCandidates)
    .where(eq(questionCandidates.id, id))
    .limit(1);
  if (!row) return { ok: false as const, reason: "missing" };
  const errors = validateQuestionDraft({
    prompt: row.prompt,
    choices: row.choices,
    correctId: row.correctId ?? "",
    explanation: row.explanation ?? "",
    difficulty: row.difficulty ?? "",
    category: row.category,
    conversationHook: row.conversationHook ?? undefined,
    sourceNotes: row.sourceNotes ?? undefined,
  });
  if (errors.length) return { ok: false as const, reason: "invalid", errors };

  await insertApprovedQuestion({
    id: row.id,
    prompt: row.prompt,
    choices: row.choices,
    correctId: row.correctId!,
    explanation: row.explanation!,
    difficulty: row.difficulty as QuestionDifficulty,
    category: row.category,
    conversationHook: row.conversationHook,
    sourceNotes: row.sourceNotes,
    generationModel: row.generationModel,
  });
  await db()
    .update(questionCandidates)
    .set({ verificationStatus: "approved", validationErrors: [] })
    .where(eq(questionCandidates.id, id));
  return { ok: true as const };
}

export async function rejectCandidate(id: string) {
  await db()
    .update(questionCandidates)
    .set({ verificationStatus: "rejected" })
    .where(eq(questionCandidates.id, id));
}

export async function reportQuestion(input: {
  questionId: string;
  pawToken?: string;
  reason?: string;
}) {
  await db().insert(questionReports).values({
    id: randomUUID(),
    questionId: input.questionId,
    pawToken: input.pawToken ?? null,
    reason: input.reason ?? null,
  });
}

export async function listQuestionReports() {
  return db()
    .select()
    .from(questionReports)
    .orderBy(desc(questionReports.createdAt));
}

export const GENERATE_PROMPT_VERSION = "v2";

export function generationSystemPrompt() {
  return `You write questions for a local bar/restaurant game in Houston.
The table should want to argue, laugh, or tell a story — not feel like a worksheet.
Return ONLY a JSON object: {"questions":[...]}.
Each question has:
- prompt (string, one lively sentence with a hook or a surprise)
- choices: four objects {id:"a"|"b"|"c"|"d", label:string}
- correctId: "a"|"b"|"c"|"d"
- explanation: one or two sentences people would actually say out loud
- difficulty: "easy"|"medium"|"hard"
- category: "general"|"houston"|"music"|"food"|"sports"|"nightlife"
- conversationHook: the remark that starts talk at the table
- sourceNotes: a short factual basis

Rules:
- Independent, not promotional. Never mention brands, apps, or sponsors.
- No politics, medical advice, or sensitive disputes.
- Not ambiguous. One clearly correct answer.
- Mix Houston/Texas/bar/food/sports with a few sharp general facts.
- Ban dull counting trivia: dozens, guitar strings, piano keys, "how many", "what color is", capitals, multiplication.
- Easy still has to be interesting. A question a 10-year-old already knows is a miss.
- Write like a person at the bar, not a textbook.`;
}

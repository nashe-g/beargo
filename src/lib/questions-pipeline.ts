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

const LOCAL_PLACE_WORDS = [
  "houston",
  "beaumont",
  "galveston",
  "montrose",
  "midland",
  "huntsville",
  "sam houston",
  "spindletop",
  "johnson space",
  "rice university",
  "the rustic",
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
  const blob = `${prompt} ${labels.join(" ")} ${draft.explanation ?? ""} ${draft.conversationHook ?? ""}`.toLowerCase();
  if (SPONSOR_WORDS.some((word) => blob.includes(word))) {
    errors.push("Question looks promotional or mentions BearGo/sponsors.");
  }
  if (LOCAL_PLACE_WORDS.some((word) => blob.includes(word))) {
    errors.push("Question is too local. Keep it a bar argument anyone in the US could have.");
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

export const GENERATE_PROMPT_VERSION = "v5";

export function generationSystemPrompt() {
  return `You are writing trivia for a 60-second game people play at a table in a bar, cafe, or restaurant — then put the phone down and talk. The round succeeds if someone says "wait, really?", someone argues, and they want to play again next visit.

This is not pub-league specialist trivia. It is not a classroom worksheet. It is not local-city tourism. It is not a week of beer, darts, and sports just because those live in a bar.

Return ONLY a JSON object in the shape requested by the user.

Each question:
- prompt: one sentence with a hook, a trap, or a surprise. People should lean in before they see the answers.
- choices: four objects {id:"a"|"b"|"c"|"d", label:string}. Short, distinct, tempting. One is clearly right; at least one is the answer a confident person would wrongly pick.
- correctId: "a"|"b"|"c"|"d"
- explanation: one or two sentences a person would say out loud after the reveal — not a Wikipedia recap
- difficulty: "easy"|"medium"|"hard"
- category: pick the best fit from "music"|"movies"|"tv"|"food"|"drink"|"sports"|"science"|"animals"|"history"|"language"|"tech"|"pop"|"weird"|"nightlife"|"general"
- conversationHook: the remark that starts talk at the table
- sourceNotes: the factual basis, briefly

What "interesting" means here:
- A fact almost everyone half-knows, with the detail they always get wrong
- Two things people mix up (the name vs the thing, the myth vs the rule, the famous one vs the actual one)
- A "I can't believe that's true" beat that still has one clean answer
- Something they will repeat to the next person who sits down
- Easy is still a story or a trap — never a question a bored 10-year-old already knows
- Hard is still fair at a table. Obscure-for-obscure's-sake is a miss

Draw from a wide world. Across a week you should wander, not camp. Mix among:
music and lyrics people misremember; movies and TV details; food and cooking arguments (not just bar drinks); animals and the natural world; space, bodies, weather, everyday science; words, phrases, and idioms; inventions and tech everyone uses; history that isn't a dates quiz; pop culture, celebrity-adjacent facts that aren't gossip; odd true things that sound fake; sports only when the question is a fun misremembered rule, not a stats dump.

Variety is mandatory. Do not let drink, beer, whiskey, darts, or sports-rules questions dominate. In a 21-question night, at most three may be about alcohol, bar gear, or sports. Across seven days, those themes should be the exception, not the default. If you notice you are about to write another pint / IBU / dartboard / innings question, pick a completely different domain.

Never:
- brands, apps, sponsors, or anything promotional
- politics, medical advice, or sensitive disputes
- ambiguous questions or two defensible correct answers
- a named US city, skyline, local landmark, local team, "this town," state-history tourism, oil boom, or space-center geography
- counting trivia, capitals, multiplication, "how many strings," piano keys, "what color is"
- textbook stems ("Which of the following is true…")
- repeating the same hook with different nouns

Write like a sharp person at the table, not an encyclopedia and not a brand voice.
Honor any operator note even when it conflicts with the rest of this prompt.`;
}

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { questionSlates, questions } from "@/db/schema";
import { insertApprovedQuestion } from "@/lib/catalog";
import { BEARGO_DAY_ZONE, SLATE_HORIZON_DAYS } from "@/lib/config";
import {
  dateRange,
  formatWeekday,
  localDateInZone,
} from "@/lib/dates";
import {
  NIGHT_PACKS,
  NIGHT_SLATE_SIZE,
  QUESTIONS_PER_CHALLENGE,
  isFullNightSlate,
  takePacksFromDrafts,
} from "@/lib/question-packs";
import {
  validateQuestionDraft,
  type CandidateDraft,
} from "@/lib/questions-pipeline";
import type { Question, QuestionDifficulty } from "@/lib/questions";

const SLOTS: QuestionDifficulty[] = ["easy", "medium", "hard"];

export type SlateStatus = "empty" | "draft" | "published";

export type DaySlate = {
  localDate: string;
  label: string;
  status: SlateStatus;
  questions: Question[];
};

let tableReady = false;

export async function ensureQuestionSlatesTable() {
  if (tableReady) return;
  await db().execute(sql`
    CREATE TABLE IF NOT EXISTS question_slates (
      local_date text PRIMARY KEY,
      status text NOT NULL DEFAULT 'draft',
      question_ids jsonb NOT NULL,
      snapshot jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      published_at timestamptz
    )
  `);
  tableReady = true;
}

export function horizonDates(at = new Date()) {
  return dateRange(localDateInZone(BEARGO_DAY_ZONE, at), SLATE_HORIZON_DAYS);
}

function asQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Question => {
    if (!item || typeof item !== "object") return false;
    const row = item as Question;
    return Boolean(row.id && row.prompt && Array.isArray(row.choices));
  });
}

function mapRow(
  localDate: string,
  row?: typeof questionSlates.$inferSelect,
): DaySlate {
  return {
    localDate,
    label: formatWeekday(localDate),
    status: (row?.status as SlateStatus | undefined) ?? "empty",
    questions: row ? asQuestions(row.snapshot) : [],
  };
}

export async function listSlatesForDates(dates: string[]): Promise<DaySlate[]> {
  await ensureQuestionSlatesTable();
  if (dates.length === 0) return [];
  const rows = await db()
    .select()
    .from(questionSlates)
    .where(inArray(questionSlates.localDate, dates));
  const byDate = new Map(rows.map((row) => [row.localDate, row]));
  return dates.map((date) => mapRow(date, byDate.get(date)));
}

export async function listHorizonSlates(at = new Date()) {
  return listSlatesForDates(horizonDates(at));
}

export function nextEmptyDates(days: DaySlate[], count: number) {
  return days
    .filter((day) => day.status === "empty")
    .slice(0, Math.max(0, count))
    .map((day) => day.localDate);
}

export async function getPublishedSlate(localDate: string) {
  await ensureQuestionSlatesTable();
  const [row] = await db()
    .select()
    .from(questionSlates)
    .where(
      and(
        eq(questionSlates.localDate, localDate),
        eq(questionSlates.status, "published"),
      ),
    )
    .limit(1);
  if (!row) return null;
  const questionsForDay = asQuestions(row.snapshot);
  if (questionsForDay.length !== 3 && !isFullNightSlate(questionsForDay)) {
    return null;
  }
  return questionsForDay;
}

export function questionsFromDrafts(
  localDate: string,
  drafts: CandidateDraft[],
): { ok: true; questions: Question[] } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  for (const [index, draft] of drafts.entries()) {
    const draftErrors = validateQuestionDraft(draft);
    if (draftErrors.length) {
      errors.push(`Q${index + 1}: ${draftErrors.join(" ")}`);
    }
  }
  const packed = takePacksFromDrafts(localDate, drafts);
  if (!packed.ok) {
    errors.push(
      `Need ${NIGHT_PACKS} easy, ${NIGHT_PACKS} medium, and ${NIGHT_PACKS} hard. Missing ${packed.missing.join(", ")}.`,
    );
    return { ok: false, errors };
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, questions: packed.questions };
}

export function validateSlateQuestions(questionsForDay: Question[]) {
  const errors: string[] = [];
  if (!isFullNightSlate(questionsForDay)) {
    errors.push(
      `Each night needs ${NIGHT_SLATE_SIZE} questions (${NIGHT_PACKS} packs of ${QUESTIONS_PER_CHALLENGE}).`,
    );
    return errors;
  }
  for (const difficulty of SLOTS) {
    const count = questionsForDay.filter(
      (question) => question.difficulty === difficulty,
    ).length;
    if (count !== NIGHT_PACKS) {
      errors.push(`Need ${NIGHT_PACKS} ${difficulty} questions, got ${count}.`);
    }
  }
  for (const question of questionsForDay) {
    const draftErrors = validateQuestionDraft({
      prompt: question.prompt,
      choices: question.choices,
      correctId: question.correctId,
      explanation: question.explanation,
      difficulty: question.difficulty,
      category: question.category,
      conversationHook: question.conversationHook,
    });
    errors.push(
      ...draftErrors.map((error) => `${question.difficulty}: ${error}`),
    );
  }
  return errors;
}

async function writeSlate(input: {
  localDate: string;
  questions: Question[];
  status: "draft" | "published";
  publishedAt?: Date | null;
}) {
  await ensureQuestionSlatesTable();
  const errors = validateSlateQuestions(input.questions);
  if (errors.length) return { ok: false as const, errors };

  const now = new Date();
  const questionIds = input.questions.map((question) => question.id);
  await db()
    .insert(questionSlates)
    .values({
      localDate: input.localDate,
      status: input.status,
      questionIds,
      snapshot: input.questions,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.publishedAt ?? null,
    })
    .onConflictDoUpdate({
      target: questionSlates.localDate,
      set: {
        status: input.status,
        questionIds,
        snapshot: input.questions,
        updatedAt: now,
        publishedAt: input.publishedAt ?? null,
      },
    });

  return { ok: true as const };
}

export async function saveDraftSlate(localDate: string, questionsForDay: Question[]) {
  await ensureQuestionSlatesTable();
  const [existing] = await db()
    .select()
    .from(questionSlates)
    .where(eq(questionSlates.localDate, localDate))
    .limit(1);
  if (existing?.status === "published") {
    return {
      ok: false as const,
      errors: ["Published days are locked. Generate the next empty days instead."],
    };
  }
  return writeSlate({
    localDate,
    questions: questionsForDay,
    status: "draft",
  });
}

export async function upsertGeneratedDraft(
  localDate: string,
  questionsForDay: Question[],
) {
  await ensureQuestionSlatesTable();
  const [existing] = await db()
    .select()
    .from(questionSlates)
    .where(eq(questionSlates.localDate, localDate))
    .limit(1);
  if (existing?.status === "published") {
    return { ok: false as const, errors: ["Published days are locked."] };
  }
  return writeSlate({
    localDate,
    questions: questionsForDay,
    status: "draft",
  });
}

async function copyIntoPool(questionsForDay: Question[]) {
  for (const question of questionsForDay) {
    const existing = await db()
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, question.id))
      .limit(1);
    if (existing.length) {
      await db()
        .update(questions)
        .set({
          prompt: question.prompt,
          choices: question.choices,
          correctId: question.correctId,
          explanation: question.explanation,
          difficulty: question.difficulty,
          category: question.category ?? "general",
          conversationHook: question.conversationHook ?? null,
          status: "approved",
        })
        .where(eq(questions.id, question.id));
      continue;
    }
    await insertApprovedQuestion({
      id: question.id,
      prompt: question.prompt,
      choices: question.choices,
      correctId: question.correctId,
      explanation: question.explanation,
      difficulty: question.difficulty,
      category: question.category,
      conversationHook: question.conversationHook,
    });
  }
}

export async function publishSlate(localDate: string) {
  await ensureQuestionSlatesTable();
  const [row] = await db()
    .select()
    .from(questionSlates)
    .where(eq(questionSlates.localDate, localDate))
    .limit(1);
  if (!row) {
    return { ok: false as const, errors: ["No draft for that day."] };
  }
  const questionsForDay = asQuestions(row.snapshot);
  const errors = validateSlateQuestions(questionsForDay);
  if (errors.length) return { ok: false as const, errors };

  await copyIntoPool(questionsForDay);
  const now = new Date();
  await db()
    .update(questionSlates)
    .set({
      status: "published",
      updatedAt: now,
      publishedAt: row.publishedAt ?? now,
    })
    .where(eq(questionSlates.localDate, localDate));
  return { ok: true as const };
}

export async function publishDates(dates: string[]) {
  const published: string[] = [];
  const failed: { localDate: string; errors: string[] }[] = [];
  for (const localDate of dates) {
    const result = await publishSlate(localDate);
    if (result.ok) published.push(localDate);
    else failed.push({ localDate, errors: result.errors });
  }
  return { published, failed };
}

export function horizonReadyCount(days: DaySlate[]) {
  return days.filter((day) => day.status === "published").length;
}

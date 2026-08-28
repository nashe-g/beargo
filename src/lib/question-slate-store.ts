import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { questionSlates, questions } from "@/db/schema";
import { insertApprovedQuestion } from "@/lib/catalog";
import { BEARGO_DAY_ZONE } from "@/lib/config";
import {
  dateRange,
  formatWeekday,
  localDateInZone,
} from "@/lib/dates";
import type { Question, QuestionDifficulty } from "@/lib/questions";
import {
  validateQuestionDraft,
  type CandidateDraft,
} from "@/lib/questions-pipeline";

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
  return dateRange(localDateInZone(BEARGO_DAY_ZONE, at), 7);
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
  if (questionsForDay.length !== 3) return null;
  return questionsForDay;
}

function slateQuestionId(localDate: string, difficulty: QuestionDifficulty) {
  return `slate-${localDate}-${difficulty}`;
}

export function questionsFromDrafts(
  localDate: string,
  drafts: CandidateDraft[],
): { ok: true; questions: Question[] } | { ok: false; errors: string[] } {
  const remaining = [...drafts];
  const picked: Question[] = [];
  const errors: string[] = [];

  for (const difficulty of SLOTS) {
    const index = remaining.findIndex((draft) => draft.difficulty === difficulty);
    const draft =
      index >= 0
        ? remaining.splice(index, 1)[0]
        : remaining.shift();
    if (!draft) {
      errors.push(`Missing ${difficulty} question.`);
      continue;
    }
    const normalized: CandidateDraft = { ...draft, difficulty };
    const draftErrors = validateQuestionDraft(normalized);
    if (draftErrors.length) {
      errors.push(`${difficulty}: ${draftErrors.join(" ")}`);
      continue;
    }
    picked.push({
      id: slateQuestionId(localDate, difficulty),
      prompt: normalized.prompt.trim(),
      choices: normalized.choices.map((choice) => ({
        id: choice.id,
        label: choice.label.trim(),
      })),
      correctId: normalized.correctId,
      explanation: normalized.explanation.trim(),
      difficulty,
      category: normalized.category ?? "general",
      conversationHook: normalized.conversationHook?.trim() || undefined,
    });
  }

  if (errors.length || picked.length !== 3) {
    return { ok: false, errors };
  }
  return { ok: true, questions: picked };
}

export function validateSlateQuestions(questionsForDay: Question[]) {
  const errors: string[] = [];
  if (questionsForDay.length !== 3) {
    errors.push("Each day needs one easy, one medium, and one hard question.");
    return errors;
  }
  for (const difficulty of SLOTS) {
    if (!questionsForDay.some((question) => question.difficulty === difficulty)) {
      errors.push(`Missing ${difficulty} question.`);
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

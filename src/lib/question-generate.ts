import {
  enqueueCandidate,
  GENERATE_PROMPT_VERSION,
  generationSystemPrompt,
  type CandidateDraft,
} from "@/lib/questions-pipeline";
import {
  questionsFromDrafts,
  upsertGeneratedDraft,
} from "@/lib/question-slate-store";

type GeneratedPayload = {
  questions?: unknown;
};

function asDraft(value: unknown): CandidateDraft | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const choicesRaw = Array.isArray(row.choices) ? row.choices : [];
  const choices = choicesRaw.map((choice, index) => {
    const item = (choice ?? {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? ["a", "b", "c", "d"][index] ?? "a"),
      label: String(item.label ?? item.text ?? ""),
    };
  });
  if (choices.length === 0 && (row.choice_a || row.choiceA)) {
    const labels = [
      row.choice_a ?? row.choiceA,
      row.choice_b ?? row.choiceB,
      row.choice_c ?? row.choiceC,
      row.choice_d ?? row.choiceD,
    ];
    labels.forEach((label, index) => {
      choices.push({
        id: ["a", "b", "c", "d"][index],
        label: String(label ?? ""),
      });
    });
  }
  return {
    prompt: String(row.prompt ?? row.question_text ?? ""),
    choices,
    correctId: String(row.correctId ?? row.correct_choice ?? "")
      .trim()
      .toLowerCase()
      .replace("choice_", "")
      .slice(0, 1),
    explanation: String(row.explanation ?? row.short_explanation ?? ""),
    difficulty: String(row.difficulty ?? row.estimated_difficulty ?? "medium")
      .toLowerCase(),
    category: String(row.category ?? "general"),
    conversationHook: row.conversationHook
      ? String(row.conversationHook)
      : row.conversation_hook
        ? String(row.conversation_hook)
        : undefined,
    sourceNotes: row.sourceNotes
      ? String(row.sourceNotes)
      : row.source_notes
        ? String(row.source_notes)
        : undefined,
  };
}

export function llmConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function llmConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error: "No OPENAI_API_KEY. Add it to generate drafts from the app.",
    };
  }
  return {
    ok: true as const,
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

async function completeJson(user: string, temperature = 0.95) {
  const config = llmConfig();
  if (!config.ok) return config;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: generationSystemPrompt() },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false as const,
      error: `LLM request failed (${response.status}).`,
      detail: detail.slice(0, 500),
    };
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  try {
    return {
      ok: true as const,
      model: config.model,
      parsed: JSON.parse(content) as unknown,
    };
  } catch {
    return { ok: false as const, error: "LLM returned JSON that could not be parsed." };
  }
}

function draftsFromUnknown(value: unknown): CandidateDraft[] {
  if (!Array.isArray(value)) return [];
  return value.map(asDraft).filter((draft): draft is CandidateDraft => Boolean(draft));
}

function extractDayDrafts(parsed: unknown, dates: string[]) {
  const byDate = new Map<string, CandidateDraft[]>();
  if (!parsed || typeof parsed !== "object") return byDate;
  const root = parsed as Record<string, unknown>;
  const days = Array.isArray(root.days) ? root.days : null;
  if (days) {
    for (const item of days) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const localDate = String(row.localDate ?? row.date ?? "");
      if (!dates.includes(localDate)) continue;
      byDate.set(localDate, draftsFromUnknown(row.questions));
    }
    return byDate;
  }
  for (const date of dates) {
    const row = root[date];
    if (!row || typeof row !== "object") continue;
    const value = row as Record<string, unknown>;
    if (Array.isArray(value.questions)) {
      byDate.set(date, draftsFromUnknown(value.questions));
    } else {
      byDate.set(
        date,
        draftsFromUnknown([value.easy, value.medium, value.hard].filter(Boolean)),
      );
    }
  }
  return byDate;
}

function weekUserPrompt(dates: string[], note?: string) {
  return [
    `Write a fresh trivia slate for these dates: ${dates.join(", ")}.`,
    "Return JSON as {\"days\":[{\"localDate\":\"YYYY-MM-DD\",\"questions\":[easy, medium, hard]}]}.",
    "Each day is one easy, one medium, one hard, in that order.",
    "Treat the week as a mixtape, not a theme night. Categories should jump around: music, movies, food, animals, science, language, history, tech, pop, weird true facts.",
    "Across the whole week, at most two questions total may be about alcohol, bar equipment, darts, or sports rules. The rest must come from other worlds.",
    "No two prompts should feel like cousins. If a day has a movie question, the next day should not.",
    "Never name a city. Never write local history.",
    note ? `Operator note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateQuestionCandidates(input: {
  count?: number;
  note?: string;
}) {
  const count = Math.min(12, Math.max(3, input.count ?? 6));
  const user = [
    `Generate ${count} questions.`,
    "Return JSON as {\"questions\":[...]}.",
    "Return 2 easy, 2 medium, and 2 hard if count is 6.",
    "Wide mix of domains. Do not default to beer, darts, or sports.",
    input.note ? `Operator note: ${input.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await completeJson(user);
  if (!result.ok) return result;

  const parsed = result.parsed as GeneratedPayload;
  const rows = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (rows.length === 0) {
    return { ok: false as const, error: "LLM returned no questions." };
  }

  const queued = [];
  for (const row of rows) {
    const draft = asDraft(row);
    if (!draft) continue;
    queued.push(
      await enqueueCandidate(draft, {
        model: result.model,
        promptVersion: GENERATE_PROMPT_VERSION,
      }),
    );
  }

  return {
    ok: true as const,
    model: result.model,
    created: queued.length,
    candidates: queued,
  };
}

export async function generateWeekSlates(input: {
  dates: string[];
  note?: string;
}) {
  const dates = input.dates;
  if (dates.length === 0) {
    return { ok: true as const, created: [] as string[], failed: [] as string[] };
  }

  let pending = [...dates];
  const created: string[] = [];
  const failed: { localDate: string; errors: string[] }[] = [];

  for (let attempt = 0; attempt < 2 && pending.length > 0; attempt += 1) {
    const result = await completeJson(weekUserPrompt(pending, input.note));
    if (!result.ok) {
      if (created.length === 0) {
        return {
          ok: false as const,
          error: result.error,
          created,
          failed: pending,
        };
      }
      return { ok: true as const, created, failed: pending };
    }
    const byDate = extractDayDrafts(result.parsed, pending);
    const stillMissing: string[] = [];
    for (const localDate of pending) {
      const drafts = byDate.get(localDate) ?? [];
      const built = questionsFromDrafts(localDate, drafts);
      if (!built.ok) {
        stillMissing.push(localDate);
        if (attempt === 1) {
          failed.push({ localDate, errors: built.errors });
        }
        continue;
      }
      const saved = await upsertGeneratedDraft(localDate, built.questions);
      if (!saved.ok) {
        stillMissing.push(localDate);
        if (attempt === 1) {
          failed.push({ localDate, errors: saved.errors });
        }
        continue;
      }
      created.push(localDate);
    }
    pending = stillMissing;
  }

  if (created.length === 0 && failed.length > 0) {
    return {
      ok: false as const,
      error: "Could not generate a valid slate for any empty day.",
      created,
      failed: failed.map((row) => row.localDate),
    };
  }

  return {
    ok: true as const,
    created,
    failed: failed.map((row) => row.localDate),
  };
}

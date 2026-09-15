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
import { NIGHT_PACKS, NIGHT_SLATE_SIZE } from "@/lib/question-packs";

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

function dayUserPrompt(localDate: string, note?: string) {
  return [
    `Write a fresh trivia slate for ${localDate}.`,
    `Return JSON as {"questions":[...]} with exactly ${NIGHT_SLATE_SIZE} questions.`,
    `Need exactly ${NIGHT_PACKS} easy, ${NIGHT_PACKS} medium, and ${NIGHT_PACKS} hard.`,
    "These become seven packs of three (easy, medium, hard) for tables of up to seven.",
    "Treat the night as a mixtape, not a theme. Categories should jump around: music, movies, food, animals, science, language, history, tech, pop, weird true facts.",
    "At most three questions may be about alcohol, bar equipment, darts, or sports rules. The rest must come from other worlds.",
    "No two prompts should feel like cousins.",
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

  const created: string[] = [];
  const failed: { localDate: string; errors: string[] }[] = [];

  for (const localDate of dates) {
    let savedOk = false;
    let lastErrors: string[] = [];
    for (let attempt = 0; attempt < 2 && !savedOk; attempt += 1) {
      const result = await completeJson(dayUserPrompt(localDate, input.note));
      if (!result.ok) {
        lastErrors = [result.error];
        continue;
      }
      const parsed = result.parsed as GeneratedPayload;
      const drafts = draftsFromUnknown(
        Array.isArray(parsed.questions) ? parsed.questions : [],
      );
      const built = questionsFromDrafts(localDate, drafts);
      if (!built.ok) {
        lastErrors = built.errors;
        continue;
      }
      const saved = await upsertGeneratedDraft(localDate, built.questions);
      if (!saved.ok) {
        lastErrors = saved.errors;
        continue;
      }
      created.push(localDate);
      savedOk = true;
    }
    if (!savedOk) {
      failed.push({ localDate, errors: lastErrors });
    }
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

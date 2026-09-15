import {
  generationSystemPrompt,
  type CandidateDraft,
} from "@/lib/questions-pipeline";
import {
  questionsFromDrafts,
  upsertGeneratedDraft,
} from "@/lib/question-slate-store";
import { NIGHT_PACKS } from "@/lib/question-packs";

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
      id: String(item.id ?? ["a", "b", "c", "d"][index] ?? "a")
        .trim()
        .toLowerCase()
        .slice(0, 1),
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

function difficultyUserPrompt(
  localDate: string,
  difficulty: "easy" | "medium" | "hard",
  used: string[],
  note?: string,
) {
  return [
    `Write exactly ${NIGHT_PACKS} ${difficulty} trivia questions for ${localDate}.`,
    `Return JSON as {"questions":[...]} with exactly ${NIGHT_PACKS} questions.`,
    `Every question's difficulty field must be "${difficulty}".`,
    "Prompt: 12–220 characters. Explanation: 8–220 characters.",
    'Choices must be objects {id:"a"|"b"|"c"|"d", label:string}. correctId must be a, b, c, or d.',
    "Mixtape, not a theme. Jump categories. No named cities. No local history.",
    "At most one of these seven may be about alcohol, bar gear, darts, or sports.",
    used.length
      ? `Already written tonight — do not repeat or cousin these prompts:\n- ${used.join("\n- ")}`
      : "",
    note ? `Operator note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateDifficultyBatch(
  localDate: string,
  difficulty: "easy" | "medium" | "hard",
  used: string[],
  note?: string,
): Promise<{ ok: true; drafts: CandidateDraft[] } | { ok: false; errors: string[] }> {
  let lastErrors = ["Could not write that set."];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await completeJson(
      [
        difficultyUserPrompt(localDate, difficulty, used, note),
        attempt
          ? `Previous attempt failed: ${lastErrors.join(" ")} Write the ${NIGHT_PACKS} ${difficulty} questions again.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    if (!result.ok) {
      lastErrors = [result.error];
      continue;
    }
    const parsed = result.parsed as GeneratedPayload;
    const drafts = draftsFromUnknown(
      Array.isArray(parsed.questions) ? parsed.questions : [],
    ).map((draft) => ({ ...draft, difficulty }));
    if (drafts.length < NIGHT_PACKS) {
      lastErrors = [`Need ${NIGHT_PACKS} ${difficulty} questions, got ${drafts.length}.`];
      continue;
    }
    return { ok: true, drafts: drafts.slice(0, NIGHT_PACKS) };
  }
  return { ok: false, errors: lastErrors };
}

export async function generateWeekSlates(input: {
  dates: string[];
  note?: string;
}) {
  const dates = input.dates;
  if (dates.length === 0) {
    return {
      ok: true as const,
      created: [] as string[],
      failed: [] as string[],
      failedErrors: [] as { localDate: string; errors: string[] }[],
    };
  }

  const created: string[] = [];
  const failed: { localDate: string; errors: string[] }[] = [];
  const difficulties = ["easy", "medium", "hard"] as const;

  for (const localDate of dates) {
    const used: string[] = [];
    const drafts: CandidateDraft[] = [];
    let dayErrors: string[] = [];
    for (const difficulty of difficulties) {
      const batch = await generateDifficultyBatch(
        localDate,
        difficulty,
        used,
        input.note,
      );
      if (!batch.ok) {
        dayErrors = batch.errors;
        break;
      }
      drafts.push(...batch.drafts);
      used.push(...batch.drafts.map((draft) => draft.prompt.trim()));
    }
    if (dayErrors.length) {
      failed.push({ localDate, errors: dayErrors });
      continue;
    }
    const built = questionsFromDrafts(localDate, drafts);
    if (!built.ok) {
      failed.push({ localDate, errors: built.errors });
      continue;
    }
    const saved = await upsertGeneratedDraft(localDate, built.questions);
    if (!saved.ok) {
      failed.push({ localDate, errors: saved.errors });
      continue;
    }
    created.push(localDate);
  }

  if (created.length === 0 && failed.length > 0) {
    return {
      ok: false as const,
      error:
        failed[0]?.errors.join(" ") ??
        "Could not generate a valid 21-question night.",
      created,
      failed: failed.map((row) => row.localDate),
      failedErrors: failed,
    };
  }

  return {
    ok: true as const,
    created,
    failed: failed.map((row) => row.localDate),
    failedErrors: failed,
  };
}

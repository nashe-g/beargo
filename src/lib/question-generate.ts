import {
  enqueueCandidate,
  GENERATE_PROMPT_VERSION,
  generationSystemPrompt,
  type CandidateDraft,
} from "@/lib/questions-pipeline";

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

export async function generateQuestionCandidates(input: {
  count?: number;
  note?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error: "No OPENAI_API_KEY. Add it to generate drafts from the app.",
    };
  }

  const count = Math.min(12, Math.max(3, input.count ?? 6));
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const user = [
    `Generate ${count} questions.`,
    "Return 2 easy, 2 medium, and 2 hard if count is 6.",
    input.note ? `Operator note: ${input.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
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
  let parsed: GeneratedPayload;
  try {
    parsed = JSON.parse(content) as GeneratedPayload;
  } catch {
    return { ok: false as const, error: "LLM returned JSON that could not be parsed." };
  }

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
        model,
        promptVersion: GENERATE_PROMPT_VERSION,
      }),
    );
  }

  return {
    ok: true as const,
    model,
    created: queued.length,
    candidates: queued,
  };
}

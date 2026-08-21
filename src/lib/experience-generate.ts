import {
  emptyExperienceBody,
  liveFormat,
  stripImagesFromBody,
  type AdaptationMode,
  type ExperienceBody,
  type ExperienceInteraction,
  type InspirationSeed,
} from "@/lib/experience";
import { llmConfigured } from "@/lib/question-generate";

export { llmConfigured };

function asInteraction(value: unknown, index: number): ExperienceInteraction | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const prompt = String(row.prompt ?? row.question ?? "").trim();
  if (!prompt) return null;
  const choicesRaw = Array.isArray(row.choices) ? row.choices : [];
  const choices = choicesRaw.map((choice, choiceIndex) => {
    const item = (choice ?? {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? ["a", "b", "c", "d"][choiceIndex] ?? `c${choiceIndex}`),
      label: String(item.label ?? item.text ?? "").trim(),
      tag: item.tag ? String(item.tag) : undefined,
    };
  }).filter((choice) => choice.label);
  return {
    id: String(row.id ?? `q${index + 1}`),
    kind: row.kind ? (String(row.kind) as ExperienceInteraction["kind"]) : undefined,
    prompt,
    choices: choices.length > 0 ? choices : undefined,
    correctId: row.correctId ? String(row.correctId) : undefined,
    explanation: row.explanation ? String(row.explanation) : undefined,
    conversationHook: row.conversationHook ? String(row.conversationHook) : undefined,
    timeLimitSeconds: row.timeLimitSeconds ? Number(row.timeLimitSeconds) : undefined,
    placeholder: row.placeholder ? String(row.placeholder) : undefined,
  };
}

function asBody(value: unknown, seed: InspirationSeed): ExperienceBody {
  const fallback = emptyExperienceBody(seed.beargo_primary_format, seed);
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const interactionsRaw = Array.isArray(row.interactions)
    ? row.interactions
    : Array.isArray(row.questions)
      ? row.questions
      : [];
  const interactions = interactionsRaw
    .map((item, index) => asInteraction(item, index))
    .filter((item): item is ExperienceInteraction => Boolean(item));
  const payoffRaw = (row.payoff ?? {}) as Record<string, unknown>;
  return stripImagesFromBody({
    title: String(row.title ?? fallback.title),
    hook: String(row.hook ?? fallback.hook),
    format: liveFormat(fallback.format),
    estimatedDurationSeconds: Number(
      row.estimatedDurationSeconds ?? seed.suggested_beargo_length_seconds ?? 45,
    ),
    interactions,
    payoff: {
      kind:
        (payoffRaw.kind as ExperienceBody["payoff"]["kind"]) ||
        fallback.payoff.kind,
      headline: String(payoffRaw.headline ?? ""),
      body: String(payoffRaw.body ?? ""),
      labels: Array.isArray(payoffRaw.labels)
        ? payoffRaw.labels.map((label) => {
            const item = (label ?? {}) as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              title: String(item.title ?? ""),
              body: String(item.body ?? ""),
            };
          })
        : undefined,
      template: payoffRaw.template ? String(payoffRaw.template) : undefined,
    },
    imageBriefs: [],
    warnings: Array.isArray(row.warnings)
      ? row.warnings.map((item) => String(item))
      : [],
  });
}

function systemPrompt() {
  return `You write original BearGo daily experiences for people standing in a Houston bar, cafe, or restaurant with a phone in one hand.

Constraints:
- About 60 seconds. Hard max 75. Ideally 3-7 interactions.
- Mobile-first. Low reading burden. No account. No unnecessary PII.
- Works alone in a noisy venue. No audio. No second player.
- Entertainment only. Never present results as medical, legal, or financial fact.
- Do not scrape or republish a source quiz body. Write original copy.
- Venue-safe tone. Screenshot/compare potential is good. Weak payoffs are not.
- Text only. No images, photos, logos, screenshots, album art, or fandom stills. Emoji in the prompt is allowed. If the source was visual, rewrite as word clues, emoji, or named choices.

Return a JSON object with:
{
  "title": string,
  "hook": string,
  "format": string,
  "estimatedDurationSeconds": number,
  "interactions": [{ "id", "kind": "single|multi|binary|rank|text|recall|showdown", "prompt", "choices": [{"id","label","tag?"}], "correctId?", "explanation?", "timeLimitSeconds?" }],
  "payoff": { "kind": "score"|"identity"|"champion"|"count"|"artifact"|"rank_list", "headline", "body", "labels?": [{"id","title","body"}], "template?" },
  "warnings": string[]
}

Format rules:
- Quick Trivia: kind single, 3-5 questions, four choices a/b/c/d, correctId, explanation, payoff kind score. Emoji or short word clues are fine.
- Personality Reveal / Build Something: kind single, 4-6 preference taps. Each choice has tag matching a payoff.labels id. Payoff kind identity, 3-5 labels.
- Checklist: kind multi, one or two screens of tap-all-that-apply. Payoff kind count, optional labels for low/mid/high. Name items in words, not posters.
- Hot Takes: kind binary, 4-6 rapid this-or-that. Payoff kind count or identity.
- Showdown: either several binary rounds, or one showdown interaction with 4+ choices (tournament). Payoff kind champion.
- Rank It: kind rank, one short list of 4-5 items. Payoff kind rank_list.
- Timed Recall: kind recall, one prompt, timeLimitSeconds 15-20. Payoff kind count.
- Generator / Wildcard: 3-4 single or text inputs. payoff.template like "{0} {1} Special". Payoff kind artifact.
Never include image URLs or image briefs.`;
}

export async function generateExperienceDraft(input: {
  seed: InspirationSeed;
  adaptationMode: AdaptationMode;
  notes?: string | null;
}): Promise<
  | { ok: true; body: ExperienceBody; model: string }
  | { ok: false; error: string }
> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "No OPENAI_API_KEY. Add it to generate drafts." };
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const highRisk = input.seed.copyright_asset_risk === "high";
  const modeNote =
    highRisk
      ? "Mode: inspired only. The source was image-heavy or high copyright risk. Do not near-adopt stills, logos, screenshots, or fandom art. Rewrite as original text, emoji, or word clues. Follow original_beargo_inspiration when it is already venue-safe text."
      : input.adaptationMode === "near_adopt"
        ? "Mode: near_adopt. Preserve the major essence of the source concept. Compress to 60 seconds. Text only. Venue tone. Do not claim scientific accuracy."
        : "Mode: inspired. Use the mechanic, hook shape, and payoff type. Write original BearGo copy and interactions. original_beargo_inspiration is a starting prompt, not mandatory wording.";

  const user = [
    modeNote,
    input.notes ? `Content note: ${input.notes}` : "",
    "Seed JSON:",
    JSON.stringify(input.seed),
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, error: `LLM request failed (${response.status}).` };
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, error: "LLM returned JSON that could not be parsed." };
  }

  const body = asBody(parsed, input.seed);
  const min = ["Rank It", "Timed Recall", "Showdown", "Checklist"].includes(
    liveFormat(input.seed.beargo_primary_format),
  )
    ? 1
    : 3;
  if (body.interactions.length < min) {
    return { ok: false, error: "Draft did not include enough interactions. Try again." };
  }
  return { ok: true, body, model };
}

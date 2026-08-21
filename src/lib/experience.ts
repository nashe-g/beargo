import type { Question } from "@/lib/questions";

export const BEARGO_FORMATS = [
  "Quick Trivia",
  "Personality Reveal",
  "Checklist",
  "Hot Takes",
  "Showdown",
  "Tap the Image",
  "Timed Recall",
  "Rank It",
  "Build Something",
  "Generator / Wildcard",
] as const;

export type BeargoFormat = (typeof BEARGO_FORMATS)[number];

/** Formats the console can plant. Tap the Image is stored in the library, then remapped to trivia. */
export const LIVE_FORMATS = BEARGO_FORMATS.filter(
  (format) => format !== "Tap the Image",
) as BeargoFormat[];

export type AdaptationMode = "inspired" | "near_adopt";
export type ExperienceStatus = "draft" | "ready" | "published";

export type ExperienceChoice = {
  id: string;
  label: string;
  tag?: string;
  imageUrl?: string;
};

export type InteractionKind =
  | "single"
  | "multi"
  | "binary"
  | "rank"
  | "text"
  | "image"
  | "recall"
  | "showdown";

export type ExperienceInteraction = {
  id: string;
  kind?: InteractionKind;
  prompt: string;
  choices?: ExperienceChoice[];
  correctId?: string;
  explanation?: string;
  conversationHook?: string;
  imageUrl?: string;
  timeLimitSeconds?: number;
  placeholder?: string;
};

export type ExperiencePayoff = {
  kind: "score" | "identity" | "champion" | "count" | "artifact" | "rank_list";
  headline: string;
  body: string;
  labels?: { id: string; title: string; body: string }[];
  template?: string;
};

export type ExperienceImageBrief = {
  slot: string;
  brief: string;
  url?: string;
  required: boolean;
};

export type ExperienceBody = {
  title: string;
  hook: string;
  format: BeargoFormat;
  estimatedDurationSeconds: number;
  interactions: ExperienceInteraction[];
  payoff: ExperiencePayoff;
  imageBriefs: ExperienceImageBrief[];
  warnings: string[];
};

export type InspirationSeed = {
  id: string;
  source: string;
  source_url: string;
  source_title: string;
  source_author?: string;
  source_date?: string;
  buzzfeed_category?: string;
  beargo_primary_format: string;
  beargo_secondary_formats?: string[];
  themes: string[];
  pattern_family?: string;
  hook_pattern?: string;
  interaction_summary?: string;
  payoff_summary?: string;
  why_it_works?: string;
  beargo_60s_feasibility?: string;
  suggested_beargo_length_seconds?: number;
  suggested_interaction_count?: number;
  image_requirement?: string;
  image_type?: string[];
  copyright_asset_risk?: string;
  shelf_life?: string;
  original_beargo_inspiration?: string;
  rejection_risk_notes?: string;
  research_notes?: string;
  overall_beargo_score?: number;
  hook_strength?: number;
  result_payoff_strength?: number;
  interaction_strength?: number;
  venue_fit?: number;
};

export type ExperienceRecord = {
  id: string;
  seedId: string;
  adaptationMode: AdaptationMode;
  format: string;
  status: ExperienceStatus;
  title: string;
  notes: string | null;
  body: ExperienceBody;
  createdAt: Date;
  updatedAt: Date;
};

export function liveFormat(format: string): BeargoFormat {
  if (format === "Tap the Image") return "Quick Trivia";
  return BEARGO_FORMATS.includes(format as BeargoFormat)
    ? (format as BeargoFormat)
    : "Quick Trivia";
}

export function flattenSeedForProduct(seed: InspirationSeed): InspirationSeed {
  return {
    ...seed,
    beargo_primary_format: liveFormat(seed.beargo_primary_format),
    beargo_secondary_formats: (seed.beargo_secondary_formats ?? []).filter(
      (format) => format !== "Tap the Image",
    ),
    image_requirement: "none",
    image_type: [],
  };
}

export function adaptationModeForSeed(
  seed: InspirationSeed,
  requested: AdaptationMode,
): AdaptationMode {
  if (seed.copyright_asset_risk === "high") return "inspired";
  return requested;
}

export function payoffKindForFormat(format: string): ExperiencePayoff["kind"] {
  const live = liveFormat(format);
  if (live === "Quick Trivia") return "score";
  if (live === "Checklist" || live === "Timed Recall") return "count";
  if (live === "Showdown") return "champion";
  if (live === "Rank It") return "rank_list";
  if (live === "Generator / Wildcard") return "artifact";
  if (live === "Hot Takes") return "count";
  return "identity";
}

export function emptyExperienceBody(format: string, seed?: InspirationSeed): ExperienceBody {
  const live = liveFormat(format);
  return {
    title: seed?.original_beargo_inspiration?.slice(0, 80) || seed?.source_title || "",
    hook: seed?.hook_pattern || "",
    format: live,
    estimatedDurationSeconds: seed?.suggested_beargo_length_seconds ?? 45,
    interactions: [],
    payoff: {
      kind: payoffKindForFormat(live),
      headline: "",
      body: "",
    },
    imageBriefs: [],
    warnings: [],
  };
}

export function triviaQuestionsFromExperience(body: ExperienceBody): Question[] {
  return body.interactions
    .filter((item) => item.prompt.trim() && (item.choices?.length ?? 0) >= 2)
    .map((item, index) => ({
      id: item.id || `q${index + 1}`,
      prompt: item.prompt.trim(),
      choices: (item.choices ?? []).map((choice) => ({
        id: choice.id,
        label: choice.label,
      })),
      correctId: item.correctId ?? "a",
      explanation: item.explanation?.trim() || "That’s the one.",
      difficulty: "medium" as const,
      conversationHook: item.conversationHook,
    }));
}

export function imageSlotsMissing(_body: ExperienceBody) {
  return [];
}

export function stripImagesFromBody(body: ExperienceBody): ExperienceBody {
  return {
    ...body,
    format: liveFormat(body.format),
    imageBriefs: [],
    interactions: body.interactions.map((item) => ({
      ...item,
      kind: item.kind === "image" ? "single" : item.kind,
      imageUrl: undefined,
      choices: item.choices?.map((choice) => ({
        ...choice,
        imageUrl: undefined,
      })),
    })),
  };
}

export function hydrateExperienceImages(body: ExperienceBody): ExperienceBody {
  return stripImagesFromBody(body);
}

export function formatIsPlayableToday(format: string) {
  return LIVE_FORMATS.includes(liveFormat(format));
}

export function defaultInteractionKind(
  format: string,
  interaction: ExperienceInteraction,
  interactionCount: number,
): InteractionKind {
  if (interaction.kind && interaction.kind !== "image") return interaction.kind;
  const live = liveFormat(format);
  if (live === "Checklist") return "multi";
  if (live === "Hot Takes") return "binary";
  if (live === "Rank It") return "rank";
  if (live === "Timed Recall") return "recall";
  if (live === "Showdown") {
    const n = interaction.choices?.length ?? 0;
    if (interactionCount === 1 && n >= 4) return "showdown";
    return "binary";
  }
  if (live === "Generator / Wildcard" && !interaction.choices?.length) {
    return "text";
  }
  return "single";
}

export function weekDiversityWarnings(formats: string[]) {
  const warnings: string[] = [];
  const personality = formats.filter((format) => format === "Personality Reveal").length;
  if (personality >= 5) {
    warnings.push("This week is heavy on Personality Reveal. Mix formats if you can.");
  }
  return warnings;
}

import { FEED_MODERATION_SHADOW } from "@/lib/config";
import { detectFeedPii } from "@/lib/feed-pii";

export type ModerationDecision = "allow" | "block" | "intervene" | "unavailable";

export type FeedModeration = {
  piiDetected: boolean;
  piiTypes: string[];
  omniFlagged: boolean | null;
  scores: Record<string, number>;
  decision: ModerationDecision;
  decisionReason: string;
  wouldDecision: Exclude<ModerationDecision, "unavailable">;
  wouldReason: string;
};

type OmniResult = {
  flagged?: boolean;
  category_scores?: Record<string, number>;
};

function score(scores: Record<string, number>, key: string) {
  return scores[key] ?? 0;
}

function fullPolicy(
  piiTypes: string[],
  scores: Record<string, number>,
): { decision: Exclude<ModerationDecision, "unavailable">; reason: string } {
  if (piiTypes.length > 0) return { decision: "block", reason: "pii" };

  const sexualMinors = score(scores, "sexual/minors");
  if (sexualMinors >= 0.2) return { decision: "block", reason: "sexual_minors" };

  const threat =
    score(scores, "harassment/threatening") >= 0.85 ||
    score(scores, "hate/threatening") >= 0.85 ||
    (score(scores, "violence") >= 0.95 &&
      (score(scores, "harassment/threatening") >= 0.4 ||
        score(scores, "hate/threatening") >= 0.4));
  if (threat) return { decision: "block", reason: "threat" };

  if (score(scores, "hate") >= 0.92) return { decision: "block", reason: "hate" };
  if (score(scores, "harassment") >= 0.94) {
    return { decision: "block", reason: "harassment" };
  }
  if (score(scores, "sexual") >= 0.9) return { decision: "block", reason: "sexual" };

  if (score(scores, "harassment") >= 0.8) {
    return { decision: "intervene", reason: "harassment_borderline" };
  }
  if (score(scores, "sexual") >= 0.75) {
    return { decision: "intervene", reason: "sexual_borderline" };
  }
  if (score(scores, "violence") >= 0.88) {
    return { decision: "intervene", reason: "violence_borderline" };
  }

  return { decision: "allow", reason: "ok" };
}

function enforce(policy: {
  decision: Exclude<ModerationDecision, "unavailable">;
  reason: string;
}): { decision: Exclude<ModerationDecision, "unavailable">; reason: string } {
  if (!FEED_MODERATION_SHADOW) return policy;
  if (
    policy.reason === "pii" ||
    policy.reason === "threat" ||
    policy.reason === "sexual_minors"
  ) {
    return policy;
  }
  return { decision: "allow", reason: `shadow:${policy.reason}` };
}

function llmConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false as const };
  return {
    ok: true as const,
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
  };
}

async function omniScores(text: string): Promise<{
  ok: true;
  flagged: boolean;
  scores: Record<string, number>;
} | { ok: false }> {
  const config = llmConfig();
  if (!config.ok) {
    if (process.env.NODE_ENV === "production") return { ok: false };
    return { ok: true, flagged: false, scores: {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${config.baseUrl}/moderations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false };
    const payload = (await response.json()) as { results?: OmniResult[] };
    const result = payload.results?.[0];
    return {
      ok: true,
      flagged: Boolean(result?.flagged),
      scores: result?.category_scores ?? {},
    };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function moderateFeedText(text: string): Promise<FeedModeration> {
  const pii = detectFeedPii(text);
  const omni = await omniScores(text);
  if (!omni.ok) {
    return {
      piiDetected: pii.types.length > 0,
      piiTypes: pii.types,
      omniFlagged: null,
      scores: {},
      decision: pii.types.length > 0 ? "block" : "unavailable",
      decisionReason: pii.types.length > 0 ? "pii" : "omni_unavailable",
      wouldDecision: pii.types.length > 0 ? "block" : "allow",
      wouldReason: pii.types.length > 0 ? "pii" : "omni_unavailable",
    };
  }

  const policy = fullPolicy(pii.types, omni.scores);
  const live = enforce(policy);
  return {
    piiDetected: pii.types.length > 0,
    piiTypes: pii.types,
    omniFlagged: omni.flagged,
    scores: omni.scores,
    decision: live.decision,
    decisionReason: live.reason,
    wouldDecision: policy.decision,
    wouldReason: policy.reason,
  };
}

export function feedRejectMessage(reason: string) {
  if (reason === "pii") {
    return "Don't post phone numbers, emails, or other personal contact info.";
  }
  if (reason === "omni_unavailable") {
    return "Posting is temporarily unavailable. Try again shortly.";
  }
  if (reason === "presence") {
    return "Scan the Paw at the bar to talk.";
  }
  if (reason === "rate") {
    return "Easy. Try again in a bit.";
  }
  if (reason === "cooldown" || reason === "suspended" || reason === "banned") {
    return "You're paused from posting right now.";
  }
  return "This post may violate our community rules. Edit it and try again.";
}

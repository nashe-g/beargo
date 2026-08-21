import {
  defaultInteractionKind,
  type ExperienceBody,
  type ExperienceChoice,
  type ExperienceInteraction,
} from "@/lib/experience";

export type PlayAnswer = {
  interactionId: string;
  choiceIds: string[];
  text?: string;
  order?: string[];
  responseMs: number;
};

export type PayoffView = {
  kind: ExperienceBody["payoff"]["kind"];
  headline: string;
  body: string;
  scoreLine?: string;
  correctCount: number;
  questionCount: number;
};

export function pawProgress(index: number, total: number) {
  if (total <= 0) return { filledToes: 0, padFilled: false };
  if (index >= total) return { filledToes: 4, padFilled: true };
  const units = Math.round((index / total) * 5);
  return {
    filledToes: Math.min(4, units),
    padFilled: false,
  };
}

function choiceById(interaction: ExperienceInteraction, id: string) {
  return interaction.choices?.find((choice) => choice.id === id);
}

function tagFor(choice: ExperienceChoice | undefined) {
  return choice?.tag || choice?.id || "";
}

function fillTemplate(template: string, parts: string[]) {
  return template.replace(/\{(\d+)\}/g, (_, index) => parts[Number(index)] ?? "");
}

function pickLabel(
  body: ExperienceBody,
  key: string,
  fallbackIndex = 0,
) {
  const labels = body.payoff.labels?.filter((label) => label.id || label.title) ?? [];
  if (labels.length === 0) return null;
  const exact = labels.find(
    (label) => label.id === key || label.title.toLowerCase() === key.toLowerCase(),
  );
  if (exact) return exact;
  return labels[Math.abs(fallbackIndex) % labels.length] ?? null;
}

function tallyTags(body: ExperienceBody, answers: PlayAnswer[]) {
  const counts = new Map<string, number>();
  for (const answer of answers) {
    const interaction = body.interactions.find((item) => item.id === answer.interactionId);
    const ids = answer.order?.length ? answer.order.slice(0, 1) : answer.choiceIds;
    for (const id of ids) {
      const tag = tagFor(choiceById(interaction ?? { id: "", prompt: "" }, id));
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  let best = "";
  let bestCount = -1;
  for (const [tag, count] of counts) {
    if (count > bestCount) {
      best = tag;
      bestCount = count;
    }
  }
  return { best, counts };
}

export function resolvePayoff(body: ExperienceBody, answers: PlayAnswer[]): PayoffView {
  const questionCount = Math.max(1, body.interactions.length);
  const totalMs = answers.reduce((sum, answer) => sum + answer.responseMs, 0);
  void totalMs;
  const kind = body.payoff.kind;
  const fallback: PayoffView = {
    kind,
    headline: body.payoff.headline || body.title || "That’s today’s BearGo.",
    body: body.payoff.body || "That’s the game.",
    correctCount: 0,
    questionCount,
  };

  if (kind === "score") {
    let correctCount = 0;
    for (const interaction of body.interactions) {
      const answer = answers.find((item) => item.interactionId === interaction.id);
      if (interaction.correctId && answer?.choiceIds[0] === interaction.correctId) {
        correctCount += 1;
      }
    }
    return {
      ...fallback,
      correctCount,
      scoreLine: `${correctCount} / ${questionCount}`,
      headline: body.payoff.headline || "That’s the game.",
    };
  }

  if (kind === "count") {
    const selected = answers.reduce((sum, answer) => {
      if (answer.text) return sum + answer.text.split(/[\n,]/).filter(Boolean).length;
      return sum + (answer.choiceIds.length || (answer.text ? 1 : 0));
    }, 0);
    const capacity = body.interactions.reduce((sum, interaction) => {
      const kindName = defaultInteractionKind(body.format, interaction, body.interactions.length);
      if (kindName === "recall") return sum + 12;
      return sum + (interaction.choices?.length ?? 0);
    }, 0);
    const labels = body.payoff.labels ?? [];
    const bucket =
      labels.length === 0
        ? null
        : labels[Math.min(labels.length - 1, Math.floor((selected / Math.max(1, capacity)) * labels.length))];
    return {
      ...fallback,
      correctCount: selected,
      questionCount: Math.max(1, capacity),
      scoreLine: `${selected}`,
      headline: bucket?.title || body.payoff.headline || `${selected}.`,
      body: bucket?.body || body.payoff.body || "That’s your count.",
    };
  }

  if (kind === "artifact") {
    const parts = answers.map((answer) => {
      const interaction = body.interactions.find((item) => item.id === answer.interactionId);
      if (answer.text?.trim()) return answer.text.trim();
      const labels = answer.choiceIds
        .map((id) => choiceById(interaction ?? { id: "", prompt: "" }, id)?.label)
        .filter(Boolean);
      return labels.join(" ");
    });
    const title = body.payoff.template
      ? fillTemplate(body.payoff.template, parts)
      : parts.filter(Boolean).join(" · ");
    return {
      ...fallback,
      headline: title || body.payoff.headline || "Yours.",
      body: body.payoff.body || "That’s the one to screenshot.",
    };
  }

  if (kind === "rank_list") {
    const first = answers[0];
    const interaction = body.interactions[0];
    const topId = first?.order?.[0] ?? first?.choiceIds[0];
    const top = topId ? choiceById(interaction, topId) : undefined;
    const label = pickLabel(body, tagFor(top), 0);
    return {
      ...fallback,
      headline: label?.title || body.payoff.headline || top?.label || "Your order.",
      body:
        label?.body ||
        body.payoff.body ||
        (top ? `You put ${top.label} first.` : "That’s your order."),
    };
  }

  if (kind === "champion") {
    if (answers.length > 1) {
      const { best } = tallyTags(body, answers);
      const label = pickLabel(body, best, best.length);
      if (label || best) {
        const last = [...answers].reverse().find((answer) => answer.choiceIds[0]);
        const interaction =
          body.interactions.find((item) => item.id === last?.interactionId) ??
          body.interactions[0];
        const choice = last ? choiceById(interaction, last.choiceIds[0]) : undefined;
        return {
          ...fallback,
          headline: label?.title || choice?.label || body.payoff.headline || "Champion.",
          body: label?.body || body.payoff.body || "That’s the one that survived.",
        };
      }
    }
    const last = [...answers].reverse().find((answer) => answer.choiceIds[0]);
    const interaction =
      body.interactions.find((item) => item.id === last?.interactionId) ??
      body.interactions[0];
    const choice = last ? choiceById(interaction, last.choiceIds[0]) : undefined;
    const label = pickLabel(body, tagFor(choice), 0);
    return {
      ...fallback,
      headline: label?.title || choice?.label || body.payoff.headline || "Champion.",
      body: label?.body || body.payoff.body || "That’s the one that survived.",
    };
  }

  const { best } = tallyTags(body, answers);
  const hashed = answers.flatMap((answer) => answer.choiceIds).join("|");
  let hash = 0;
  for (const char of hashed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const label = pickLabel(body, best, hash);
  return {
    ...fallback,
    headline: label?.title || body.payoff.headline || "You.",
    body: label?.body || body.payoff.body || "That’s your read.",
  };
}

export function answersComplete(body: ExperienceBody, answers: PlayAnswer[]) {
  if (body.format === "Showdown" && body.interactions.length === 1) {
    return answers.length >= 1 && (answers.at(-1)?.choiceIds.length ?? 0) > 0;
  }
  if (body.format === "Rank It") {
    return body.interactions.every((interaction) => {
      const answer = answers.find((item) => item.interactionId === interaction.id);
      const n = interaction.choices?.length ?? 0;
      return (answer?.order?.length ?? 0) === n && n > 0;
    });
  }
  return body.interactions.every((interaction) =>
    answers.some((answer) => answer.interactionId === interaction.id),
  );
}

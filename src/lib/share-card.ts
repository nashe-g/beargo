import { sanitizeBoardName } from "@/lib/board-name";
import { parsePlayKind, type PlayKind } from "@/lib/play-kind";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import { formatWobble } from "@/lib/stack";

export type ShareGame = PlayKind | "combined";

export type ShareCardStats = {
  kind: ShareGame;
  rank: number;
  playerCount: number;
  correctCount: number;
  stackWobble: number;
  boardName: string | null;
  dropped: number | null;
  packed: number | null;
  totalResponseMs?: number | null;
};

function one(
  query: Record<string, string | string[] | undefined>,
  key: string,
) {
  const raw = query[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function intIn(raw: string | undefined, min: number, max: number) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function parseShareCard(
  query: Record<string, string | string[] | undefined>,
): ShareCardStats | null {
  const rank = intIn(one(query, "r"), 0, 99_999);
  const playerCount = intIn(one(query, "n"), 0, 99_999);
  if (rank == null || playerCount == null) return null;

  const kind = parsePlayKind(one(query, "k")) ?? "combined";
  const correctCount = intIn(one(query, "c"), 0, QUESTIONS_PER_CHALLENGE) ?? 0;
  const stackWobble = intIn(one(query, "w"), 0, 99_999) ?? 0;
  const totalResponseMs = intIn(one(query, "t"), 0, 9_999_999);

  if (kind === "stack" && intIn(one(query, "w"), 0, 99_999) == null) return null;
  if (kind === "trivia" && intIn(one(query, "c"), 0, QUESTIONS_PER_CHALLENGE) == null) {
    return null;
  }
  if (kind === "combined") {
    if (
      intIn(one(query, "c"), 0, QUESTIONS_PER_CHALLENGE) == null ||
      intIn(one(query, "w"), 0, 99_999) == null
    ) {
      return null;
    }
  }

  const dropped = intIn(one(query, "d"), 0, 99);
  const packed = intIn(one(query, "g"), 1, 99);
  return {
    kind,
    rank,
    playerCount,
    correctCount,
    stackWobble,
    boardName: sanitizeBoardName(one(query, "b") ?? ""),
    dropped,
    packed,
    totalResponseMs,
  };
}

export function shareCardQuery(stats: ShareCardStats) {
  const params = new URLSearchParams();
  params.set("r", String(stats.rank));
  params.set("n", String(stats.playerCount));
  if (stats.kind !== "combined") params.set("k", stats.kind);
  if (stats.kind !== "stack") params.set("c", String(stats.correctCount));
  if (stats.kind !== "trivia") params.set("w", String(stats.stackWobble));
  if (stats.kind === "combined") {
    params.set("c", String(stats.correctCount));
    params.set("w", String(stats.stackWobble));
  }
  if (stats.boardName) params.set("b", stats.boardName);
  if (stats.dropped != null) params.set("d", String(stats.dropped));
  if (stats.packed != null) params.set("g", String(stats.packed));
  if (stats.totalResponseMs != null) params.set("t", String(stats.totalResponseMs));
  return params.toString();
}

export function shareCardPath(token: string, stats: ShareCardStats) {
  return `/p/${encodeURIComponent(token)}/s?${shareCardQuery(stats)}`;
}

export function shareCardImagePath(token: string, stats: ShareCardStats) {
  return `/p/${encodeURIComponent(token)}/s/card?${shareCardQuery(stats)}`;
}

export function shareCardTitle(host: string, stats: ShareCardStats | null) {
  if (!stats) return `BearGo at ${host}`;
  if (stats.rank > 0 && stats.playerCount > 0) {
    return `#${stats.rank} of ${stats.playerCount} at ${host}`;
  }
  return `Played at ${host}`;
}

export function shareCardScoreLines(stats: ShareCardStats) {
  if (stats.kind === "trivia") {
    const lines = [`${stats.correctCount} of ${QUESTIONS_PER_CHALLENGE} trivia`];
    if (stats.totalResponseMs != null && stats.totalResponseMs > 0) {
      lines.push(`${(stats.totalResponseMs / 1000).toFixed(1)} sec`);
    }
    return lines;
  }
  if (stats.kind === "stack") {
    const lines: string[] = [];
    if (stats.dropped != null && stats.packed != null && stats.packed > 0) {
      lines.push(`${stats.dropped} of ${stats.packed} glasses dropped`);
    }
    lines.push(`Wobble ${formatWobble(stats.stackWobble)} · lower is better`);
    return lines;
  }
  const lines = [`${stats.correctCount} of ${QUESTIONS_PER_CHALLENGE} trivia`];
  if (stats.dropped != null && stats.packed != null && stats.packed > 0) {
    lines.push(`${stats.dropped} of ${stats.packed} glasses dropped`);
  }
  lines.push(`Wobble ${formatWobble(stats.stackWobble)} · lower is better`);
  return lines;
}

export function shareCardText(host: string, stats: ShareCardStats) {
  const who = stats.boardName || "I";
  const detail = shareCardScoreLines(stats).join(". ");
  if (stats.rank > 0 && stats.playerCount > 0) {
    return `${who} went #${stats.rank} of ${stats.playerCount} at ${host}. ${detail}. Your turn.`;
  }
  return `${who} just played at ${host}. ${detail}. Your turn.`;
}

export function shareCardHeadline(stats: ShareCardStats | null) {
  if (!stats) return "Your turn.";
  if (stats.rank > 0 && stats.playerCount > 0) {
    return `#${stats.rank}`;
  }
  return "On the board.";
}

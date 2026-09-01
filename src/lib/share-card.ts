import { sanitizeBoardName } from "@/lib/board-name";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import { formatWobble } from "@/lib/stack";

export type ShareCardStats = {
  rank: number;
  playerCount: number;
  correctCount: number;
  stackWobble: number;
  boardName: string | null;
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
  const correctCount = intIn(one(query, "c"), 0, QUESTIONS_PER_CHALLENGE);
  const stackWobble = intIn(one(query, "w"), 0, 99_999);
  if (
    rank == null ||
    playerCount == null ||
    correctCount == null ||
    stackWobble == null
  ) {
    return null;
  }
  return {
    rank,
    playerCount,
    correctCount,
    stackWobble,
    boardName: sanitizeBoardName(one(query, "b") ?? ""),
  };
}

export function shareCardQuery(stats: ShareCardStats) {
  const params = new URLSearchParams();
  params.set("r", String(stats.rank));
  params.set("n", String(stats.playerCount));
  params.set("c", String(stats.correctCount));
  params.set("w", String(stats.stackWobble));
  if (stats.boardName) params.set("b", stats.boardName);
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

export function shareCardText(host: string, stats: ShareCardStats) {
  const who = stats.boardName || "I";
  const wobble = formatWobble(stats.stackWobble);
  const score = `${stats.correctCount}/${QUESTIONS_PER_CHALLENGE} · wobble ${wobble}`;
  if (stats.rank > 0 && stats.playerCount > 0) {
    return `${who} went #${stats.rank} of ${stats.playerCount} at ${host}. ${score}. Your turn.`;
  }
  return `${who} just played at ${host}. ${score}. Your turn.`;
}

export function shareCardHeadline(stats: ShareCardStats | null) {
  if (!stats) return "Your turn.";
  if (stats.rank > 0 && stats.playerCount > 0) {
    return `#${stats.rank}`;
  }
  return "On the board.";
}

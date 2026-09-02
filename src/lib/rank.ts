import type { PlayKind } from "@/lib/play-kind";

export type Play = {
  id: string;
  pawToken: string;
  hostId: string;
  challengeId: string;
  localDate: string;
  correctCount: number;
  totalResponseMs: number;
  pourMg?: number | null;
  stackWobble?: number | null;
  boardName?: string | null;
  rankingEligible?: boolean;
  playSource?: string | null;
  kind?: string | null;
  createdAt: string;
};

export type BoardNeighbor = {
  rank: number;
  name: string;
  correctCount: number;
  stackWobble: number;
  totalResponseMs: number;
  mine: boolean;
};

export type RankResult = {
  rank: number;
  playerCount: number;
  playersBeaten: number;
};

export function comparePlays(a: Play, b: Play, kind: PlayKind = "stack") {
  if (kind === "trivia") {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (a.totalResponseMs !== b.totalResponseMs) {
      return a.totalResponseMs - b.totalResponseMs;
    }
    return a.id < b.id ? -1 : 1;
  }
  const wobbleA = a.stackWobble ?? Number.POSITIVE_INFINITY;
  const wobbleB = b.stackWobble ?? Number.POSITIVE_INFINITY;
  if (wobbleA !== wobbleB) return wobbleA - wobbleB;
  return a.id < b.id ? -1 : 1;
}

export function rankPlay(
  plays: Play[],
  play: Play,
  kind: PlayKind = "stack",
): RankResult {
  const board = plays.filter(
    (entry) =>
      entry.hostId === play.hostId &&
      entry.localDate === play.localDate &&
      entry.challengeId === play.challengeId,
  );
  board.sort((left, right) => comparePlays(left, right, kind));
  const rank = board.findIndex((entry) => entry.id === play.id) + 1;

  return {
    rank,
    playerCount: board.length,
    playersBeaten: Math.max(0, board.length - rank),
  };
}

export function neighborRows(
  plays: Play[],
  play: Play,
  kind: PlayKind = "stack",
): BoardNeighbor[] {
  const board = plays
    .filter(
      (entry) =>
        entry.hostId === play.hostId &&
        entry.localDate === play.localDate &&
        entry.challengeId === play.challengeId,
    )
    .sort((left, right) => comparePlays(left, right, kind));
  const index = board.findIndex((entry) => entry.id === play.id);
  if (index < 0) return [];

  let start = Math.max(0, index - 1);
  let end = Math.min(board.length - 1, index + 1);
  if (end - start < 2 && board.length > 2) {
    if (start === 0) end = Math.min(board.length - 1, start + 2);
    else start = Math.max(0, end - 2);
  }

  return board.slice(start, end + 1).map((entry, offset) => ({
    rank: start + offset + 1,
    name: entry.boardName?.trim() || "Player",
    correctCount: entry.correctCount,
    stackWobble: entry.stackWobble ?? 0,
    totalResponseMs: entry.totalResponseMs,
    mine: entry.id === play.id,
  }));
}

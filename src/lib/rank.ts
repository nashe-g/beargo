export type Play = {
  id: string;
  pawToken: string;
  hostId: string;
  challengeId: string;
  localDate: string;
  correctCount: number;
  totalResponseMs: number;
  createdAt: string;
};

export type RankResult = {
  rank: number;
  playerCount: number;
  playersBeaten: number;
};

export function comparePlays(a: Play, b: Play) {
  if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
  if (a.totalResponseMs !== b.totalResponseMs) {
    return a.totalResponseMs - b.totalResponseMs;
  }
  return a.id < b.id ? -1 : 1;
}

export function rankPlay(plays: Play[], play: Play): RankResult {
  const board = plays.filter(
    (entry) =>
      entry.hostId === play.hostId &&
      entry.localDate === play.localDate &&
      entry.challengeId === play.challengeId,
  );
  board.sort(comparePlays);
  const rank = board.findIndex((entry) => entry.id === play.id) + 1;

  return {
    rank,
    playerCount: board.length,
    playersBeaten: Math.max(0, board.length - rank),
  };
}

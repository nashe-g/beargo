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

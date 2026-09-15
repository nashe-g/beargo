import type { PublicQuestion, TableAnswer } from "@/lib/table-test";

export type NightTableStatus = "open" | "locked" | "live" | "revealed";

export type NightTableMemberView = {
  nickname: string;
  isCreator: boolean;
  mine: boolean;
  ready: boolean;
  finished: boolean;
  correctCount?: number;
  averageMs?: number;
  carried?: boolean;
};

export type NightTablePlay = {
  questions: PublicQuestion[];
  answers: TableAnswer[];
};

export type NightTableReveal = {
  correctCount: number;
  asked: number;
  averageMs: number;
  rank: number;
  tableCount: number;
  people: {
    nickname: string;
    mine: boolean;
    correctCount: number;
    asked: number;
    averageMs: number;
    carried: boolean;
  }[];
};

export type NightTableView = {
  id: string;
  name: string;
  joinCode: string;
  status: NightTableStatus;
  serviceDay: string;
  venue: string;
  members: NightTableMemberView[];
  mineCreator: boolean;
  allReady: boolean;
  play: NightTablePlay | null;
  reveal: NightTableReveal | null;
};

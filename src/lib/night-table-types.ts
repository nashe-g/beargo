import type { PublicQuestion, TableAnswer } from "@/lib/table-test";
import type { StackRoundSeed } from "@/lib/stack";

export type NightTableStatus =
  | "open"
  | "locked"
  | "live"
  | "revealed"
  | "tray"
  | "night"
  | "room";

export type NightTrayMode = "champion" | "everyone" | "skip";

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

export type NightBoardRow = {
  name: string;
  mine: boolean;
  rank: number;
  correctCount: number;
  asked: number;
  averageMs: number;
};

export type NightBoard = {
  rank: number;
  tableCount: number;
  rows: NightBoardRow[];
};

export type NightTrayView = {
  mode: NightTrayMode | null;
  championNickname: string | null;
  minePlays: boolean;
  waitingNames: string[];
  seed: StackRoundSeed;
};

export type NightCombinedRow = {
  name: string;
  mine: boolean;
  rank: number;
  wobble: number;
  skipped: boolean;
};

export type NightCombined = {
  rank: number;
  tableCount: number;
  jumped: number;
  wobble: number;
  skipped: boolean;
  rows: NightCombinedRow[];
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
  board: NightBoard | null;
  tray: NightTrayView | null;
  night: NightCombined | null;
};

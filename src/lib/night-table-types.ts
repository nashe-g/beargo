export type NightTableStatus = "open" | "locked";

export type NightTableMemberView = {
  nickname: string;
  isCreator: boolean;
  mine: boolean;
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
};
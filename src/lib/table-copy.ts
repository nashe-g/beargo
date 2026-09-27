import { TABLE_CODE_LENGTH, TABLE_NAME_MAX, TABLE_NICK_MAX } from "@/lib/config";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function foldKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseTableName(raw: unknown) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > TABLE_NAME_MAX) return null;
  if (/[\r\n]/.test(name)) return null;
  return name;
}

export function parseNickname(raw: unknown) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > TABLE_NICK_MAX) return null;
  if (/[\r\n@]/.test(name)) return null;
  return name;
}

export function parseJoinCode(raw: unknown) {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== TABLE_CODE_LENGTH) return null;
  for (const char of code) {
    if (!CODE_ALPHABET.includes(char)) return null;
  }
  return code;
}

export { CODE_ALPHABET };

export function tableStatusLabel(
  status:
    | "open"
    | "locked"
    | "live"
    | "revealed"
    | "tray"
    | "night"
    | "room",
) {
  if (status === "open") return "Sitting";
  if (status === "locked") return "Ready";
  if (status === "live") return "The Table Test";
  if (status === "revealed") return "Standings";
  if (status === "tray") return "The tray";
  if (status === "night") return "Tonight";
  return "Chat";
}

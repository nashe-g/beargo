import { keepFromParam } from "@/lib/play-source";

export const PLAY_KINDS = ["stack", "trivia"] as const;
export type PlayKind = (typeof PLAY_KINDS)[number];

export function parsePlayKind(raw: unknown): PlayKind | null {
  if (raw === "stack" || raw === "trivia") return raw;
  return null;
}

export function hubPath(token: string, from?: string | null) {
  return `/p/${encodeURIComponent(token)}${keepFromParam(from)}`;
}

export function tableJoinPath(token: string, code: string) {
  return `/p/${encodeURIComponent(token)}/t/${encodeURIComponent(code)}`;
}

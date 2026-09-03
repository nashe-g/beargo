import { keepFromParam } from "@/lib/play-source";

export const PLAY_KINDS = ["stack", "trivia"] as const;
export type PlayKind = (typeof PLAY_KINDS)[number];

export function parsePlayKind(raw: unknown): PlayKind | null {
  if (raw === "stack" || raw === "trivia") return raw;
  return null;
}

export function triviaChallengeId(serviceDay: string) {
  return `trivia:${serviceDay}`;
}

export function isLegacyCombinedKind(kind: string | null | undefined) {
  return kind == null || kind === "combined";
}

export function hubPath(token: string, from?: string | null) {
  return `/p/${encodeURIComponent(token)}${keepFromParam(from)}`;
}

export function resultPath(token: string, kind: PlayKind) {
  return `/p/${encodeURIComponent(token)}/result?game=${kind}`;
}

export function sponsorPath(token: string, kind: PlayKind) {
  return `/p/${encodeURIComponent(token)}/sponsor?game=${kind}`;
}

export function playPath(token: string, kind: PlayKind) {
  if (kind === "stack") return `/p/${encodeURIComponent(token)}/stack`;
  return `/p/${encodeURIComponent(token)}/play`;
}

export const PLAY_SOURCES = ["in_bar", "share_link", "web"] as const;

export type PlaySource = (typeof PLAY_SOURCES)[number];

export const ENTRY_COOKIE = "beargo_entry";

export function inferPlaySource(
  token: string,
  from?: string | null,
): PlaySource {
  if (from === "share") return "share_link";
  if (token === "demo") return "web";
  return "in_bar";
}

export function parsePlaySource(raw: unknown): PlaySource | null {
  if (raw === "in_bar" || raw === "share_link" || raw === "web") return raw;
  return null;
}

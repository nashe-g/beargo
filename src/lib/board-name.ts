const MAX_LEN = 16;

export function sanitizeBoardName(raw: unknown) {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} '.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 2 || cleaned.length > MAX_LEN) return null;
  return cleaned;
}

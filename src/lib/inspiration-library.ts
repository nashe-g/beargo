import { readFileSync } from "node:fs";
import { join } from "node:path";
import { flattenSeedForProduct, type InspirationSeed } from "@/lib/experience";

let cache: InspirationSeed[] | null = null;

function libraryPath() {
  return join(process.cwd(), "content", "beargo_365_inspiration_library.jsonl");
}

export function loadInspirationLibrary(): InspirationSeed[] {
  if (cache) return cache;
  const raw = readFileSync(libraryPath(), "utf8");
  cache = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => flattenSeedForProduct(JSON.parse(line) as InspirationSeed));
  return cache;
}

export function getInspirationSeed(id: string) {
  return loadInspirationLibrary().find((seed) => seed.id === id) ?? null;
}

export function searchInspirationLibrary(input: {
  q?: string;
  format?: string;
}) {
  const q = input.q?.trim().toLowerCase() ?? "";
  return loadInspirationLibrary().filter((seed) => {
    if (input.format && seed.beargo_primary_format !== input.format) return false;
    if (!q) return true;
    const blob = [
      seed.id,
      seed.source_title,
      seed.original_beargo_inspiration,
      seed.themes?.join(" "),
      seed.beargo_primary_format,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

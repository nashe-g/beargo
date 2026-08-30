import { BEARGO_DAY_ZONE } from "@/lib/config";
import { addCalendarDays, localDateInZone } from "@/lib/dates";
import { hashSeed, mulberry32 } from "@/lib/rng";

export const VESSEL_IDS = ["pint", "weizen", "tulip"] as const;
export type VesselId = (typeof VESSEL_IDS)[number];

export const PATRON_IDS = ["a", "b", "c"] as const;
export type PatronId = (typeof PATRON_IDS)[number];

export type PourBand = "idle" | "nail" | "close" | "short" | "flood";

export type VesselSpec = {
  id: VesselId;
  label: string;
  viewBox: string;
  outline: string;
  interior: string;
  stem?: string;
  foot?: string;
  fillTop: number;
  fillBottom: number;
  fillX: number;
  fillWidth: number;
  rimY: number;
  streamX: number;
  /** Relative width at fill 0, .25, .5, .75, 1. Same tap, different rise. */
  width: readonly [number, number, number, number, number];
};

export const VESSELS: Record<VesselId, VesselSpec> = {
  pint: {
    id: "pint",
    label: "Pint",
    viewBox: "0 0 160 260",
    outline:
      "M44 36c-2 0-4 2-4 6l10 158c0 14 12 24 30 24s30-10 30-24l10-158c0-4-2-6-4-6-4-2-22-4-36-4s-32 2-36 4z",
    interior:
      "M52 46l8 152c0 10 8 16 20 16s20-6 20-16l8-152c0-2-10-4-28-4s-28 2-28 4z",
    fillTop: 44,
    fillBottom: 212,
    fillX: 42,
    fillWidth: 76,
    rimY: 36,
    streamX: 80,
    width: [0.78, 0.86, 0.96, 1.08, 1.18],
  },
  weizen: {
    id: "weizen",
    label: "Weizen",
    viewBox: "0 0 160 260",
    outline:
      "M50 26C42 26 40 36 42 48C46 90 56 130 66 156C72 170 76 176 80 178C84 176 88 170 94 156C104 130 114 90 118 48C120 36 118 26 110 26C100 24 70 24 50 26Z",
    interior:
      "M54 38C48 38 48 46 50 54C54 92 62 128 70 152C74 164 76 168 80 170C84 168 86 164 90 152C98 128 106 92 110 54C112 46 112 38 106 38C98 36 72 36 54 38Z",
    stem: "M77 176h6v40h-6z",
    foot: "M54 216c0 10 16 16 26 16s26-6 26-16h-4c-6 6-16 8-22 8s-16-2-22-8z",
    fillTop: 36,
    fillBottom: 168,
    fillX: 40,
    fillWidth: 80,
    rimY: 26,
    streamX: 80,
    width: [0.7, 0.8, 0.92, 1.08, 1.22],
  },
  tulip: {
    id: "tulip",
    label: "Tulip",
    viewBox: "0 0 160 260",
    outline:
      "M46 36C36 36 34 48 42 58C54 72 58 84 56 104C52 132 38 150 38 160C38 176 56 184 80 184C104 184 122 176 122 160C122 150 108 132 104 104C102 84 106 72 118 58C126 48 124 36 114 36C102 34 68 34 46 36Z",
    interior:
      "M52 48C46 48 46 56 52 62C62 74 64 86 62 104C58 128 48 144 48 154C48 166 62 172 80 172C98 172 112 166 112 154C112 144 102 128 98 104C96 86 98 74 108 62C114 56 114 48 108 48C98 46 72 46 52 48Z",
    stem: "M77 184h6v32h-6z",
    foot: "M54 216c0 10 16 16 26 16s26-6 26-16h-4c-6 6-16 8-22 8s-16-2-22-8z",
    fillTop: 44,
    fillBottom: 170,
    fillX: 32,
    fillWidth: 96,
    rimY: 36,
    streamX: 80,
    width: [0.74, 1.18, 1.26, 0.86, 1.08],
  },
};

export type PourSpec = {
  vesselId: VesselId;
  patronId: PatronId;
  target: number;
};

export type PourRoundSeed = {
  date: string;
  pours: PourSpec[];
};

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

export function seedPourRound(date: string, hostId = "lab"): PourRoundSeed {
  const rng = mulberry32(hashSeed(`pour:${hostId}:${date}`));
  const vessels = shuffle(rng, VESSEL_IDS);
  const patrons = shuffle(rng, PATRON_IDS);
  return {
    date,
    pours: vessels.map((vesselId, index) => ({
      vesselId,
      patronId: patrons[index] ?? "a",
      target: 0.4 + rng() * 0.32,
    })),
  };
}

export function pourResultCopy(band: PourBand) {
  if (band === "nail") return "Nailed it.";
  if (band === "close") return "This close.";
  if (band === "short") return "Short.";
  if (band === "flood") return "Over.";
  return "";
}

export function pourHeadline(fill: number, target: number) {
  const band = pourBand(fill, target);
  const mg = pourMilligrams(fill, target);
  if (band === "nail") return "Nailed it.";
  if (band === "close") return fill < target ? `${mg} mg under.` : `${mg} mg over.`;
  if (band === "short") return `Short · ${mg} mg.`;
  if (band === "flood") return `Over · ${mg} mg.`;
  return "";
}

export function pourReactionLine(fill: number, target: number) {
  const band = pourBand(fill, target);
  const delta = fill - target;
  if (band === "nail") return "That’s the one they wanted.";
  if (band === "close" && delta < 0) return "They saw it coming. One more beat.";
  if (band === "close") return "They flinched. You had it, then you didn’t.";
  if (band === "short") return "They’re still waiting.";
  if (band === "flood") return "They’re wearing it.";
  return "";
}

export function chicagoPourDate(offsetDays = 0) {
  const today = localDateInZone(BEARGO_DAY_ZONE);
  return offsetDays === 0 ? today : addCalendarDays(today, offsetDays);
}

export function liquidY(spec: VesselSpec, fill: number) {
  const span = spec.fillBottom - spec.fillTop;
  const capped = Math.min(Math.max(fill, 0), 1);
  return spec.fillBottom - capped * span;
}

export function targetY(spec: VesselSpec, target: number) {
  return liquidY(spec, target);
}

export function foamTopY(spec: VesselSpec, fill: number, foam: number) {
  const beerY = liquidY(spec, fill);
  const span = spec.fillBottom - spec.fillTop;
  const foamH = Math.min(
    Math.max(foam, 0) * span,
    Math.max(0, beerY - (spec.fillTop - 6)),
  );
  return beerY - foamH;
}

export function glassWidth(spec: VesselSpec, fill: number) {
  const t = Math.min(Math.max(fill, 0), 1) * 4;
  const lo = Math.min(3, Math.floor(t));
  const hi = lo + 1;
  const mix = t - lo;
  const a = spec.width[lo] ?? 1;
  const b = spec.width[hi] ?? a;
  return Math.max(0.5, a + (b - a) * mix);
}

export function pourBand(fill: number, target: number): PourBand {
  const delta = fill - target;
  const abs = Math.abs(delta);
  if (abs <= 0.018) return "nail";
  if (abs <= 0.045) return "close";
  return delta > 0 ? "flood" : "short";
}

export function pourMilligrams(fill: number, target: number) {
  return Math.round(Math.abs(fill - target) * 1000);
}

export function scorePourRound(
  date: string,
  hostId: string,
  fills: unknown,
): { fills: number[]; pourMg: number } | null {
  if (!Array.isArray(fills) || fills.length !== 3) return null;
  const seed = seedPourRound(date, hostId);
  const parsed: number[] = [];
  let pourMg = 0;
  for (let i = 0; i < 3; i += 1) {
    const fill = Number(fills[i]);
    const target = seed.pours[i]?.target;
    if (
      !Number.isFinite(fill) ||
      fill < 0 ||
      fill > POUR_FILL_CAP ||
      target == null
    ) {
      return null;
    }
    parsed.push(fill);
    pourMg += pourMilligrams(fill, target);
  }
  return { fills: parsed, pourMg };
}

export const POUR_FILL_CAP = 1.22;

export const POUR_STREAM = {
  volumePerSecond: 0.44,
  landFactor: 0.5,
  tapY: 4,
  pxPerMs: 1.15,
  topWidth: 6.2,
  bottomWidth: 3.6,
} as const;

/** Wet foam after a heady pour: drainage returns beer as the head collapses. */
export const FOAM_HEAD = {
  buildPerSecond: 0.19,
  max: 0.2,
  rest: 0.052,
  drainK: 3.4,
  wetFraction: 0.32,
  settleMs: 900,
} as const;

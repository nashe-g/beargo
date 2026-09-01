import {
  PAD_PATH,
  PAW_VIEWBOX,
  QR_QUIET_INSET,
  QR_SLOT,
  TOE_PATHS,
} from "@/lib/paw-geometry";
import { qrMatrix } from "@/lib/qr";

export const PAW_INK = "#1c140c";
export const PAW_CREAM = "#f4e4c8";
export const PAW_OFFWHITE = "#fffaf1";
export const PAW_WHITE = "#ffffff";
export const PAW_QUIET = "#fffdf8";

export const PAW_FILL_OPTIONS = [
  { id: "cream", label: "Cream", hex: PAW_CREAM },
  { id: "offwhite", label: "Off-white", hex: PAW_OFFWHITE },
  { id: "white", label: "White", hex: PAW_WHITE },
  { id: "black", label: "Black", hex: PAW_INK },
] as const;

export type PawFill = (typeof PAW_FILL_OPTIONS)[number]["id"];

const FILL_IDS = new Set<string>(PAW_FILL_OPTIONS.map((option) => option.id));

export function parsePawFill(raw: string | null): PawFill {
  if (raw === "ink") return "black";
  if (raw && FILL_IDS.has(raw)) return raw as PawFill;
  return "cream";
}

export function pawFillHex(fill: PawFill) {
  const option = PAW_FILL_OPTIONS.find((entry) => entry.id === fill);
  return option?.hex ?? PAW_CREAM;
}

export function pawQrSvg(scanUrl: string, fill: PawFill = "cream") {
  const paw = pawFillHex(fill);
  const quiet = fill === "black" ? PAW_WHITE : paw;
  const qr = qrMatrix(scanUrl);
  const inner = QR_SLOT.size - QR_QUIET_INSET * 2;
  const scale = inner / qr.size;
  const toes = TOE_PATHS.map(
    (toe) => `<path fill="${paw}" d="${toe.d}"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${PAW_VIEWBOX}" fill="none">
${toes}
<path fill="${paw}" d="${PAD_PATH}" stroke-linejoin="round"/>
<rect x="${QR_SLOT.x}" y="${QR_SLOT.y}" width="${QR_SLOT.size}" height="${QR_SLOT.size}" rx="${QR_SLOT.rx}" fill="${quiet}"/>
<g transform="translate(${QR_SLOT.x + QR_QUIET_INSET} ${QR_SLOT.y + QR_QUIET_INSET}) scale(${scale})" fill="${PAW_INK}">
<path d="${qr.path}"/>
</g>
</svg>
`;
}

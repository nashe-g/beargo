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
export const PAW_QUIET = "#fffdf8";

export type PawFill = "ink" | "cream";

export function parsePawFill(raw: string | null): PawFill {
  return raw === "cream" ? "cream" : "ink";
}

export function pawQrSvg(scanUrl: string, fill: PawFill = "ink") {
  const paw = fill === "cream" ? PAW_CREAM : PAW_INK;
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
<rect x="${QR_SLOT.x}" y="${QR_SLOT.y}" width="${QR_SLOT.size}" height="${QR_SLOT.size}" rx="${QR_SLOT.rx}" fill="${PAW_QUIET}"/>
<g transform="translate(${QR_SLOT.x + QR_QUIET_INSET} ${QR_SLOT.y + QR_QUIET_INSET}) scale(${scale})" fill="${PAW_INK}">
<path d="${qr.path}"/>
</g>
</svg>
`;
}

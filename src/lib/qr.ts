import QRCode from "qrcode";

export type QrMatrix = {
  size: number;
  path: string;
};

export function qrMatrix(value: string): QrMatrix {
  const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const parts: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        parts.push(`M${col} ${row}h1v1h-1z`);
      }
    }
  }

  return { size, path: parts.join("") };
}

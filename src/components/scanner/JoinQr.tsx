"use client";

import { qrMatrix } from "@/lib/qr";

export function JoinQr({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const qr = qrMatrix(value);
  return (
    <svg
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      className="mx-auto w-44 bg-pad p-3 text-ink"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <rect width={qr.size} height={qr.size} fill="#fffaf1" />
      <path d={qr.path} fill="#1a120b" />
    </svg>
  );
}

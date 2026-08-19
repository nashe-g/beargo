import { qrMatrix } from "@/lib/qr";

export function VoucherQr({ value, label }: { value: string; label: string }) {
  const matrix = qrMatrix(value);
  return (
    <svg
      viewBox={`0 0 ${matrix.size} ${matrix.size}`}
      className="mx-auto w-48 text-ink"
      role="img"
      aria-label={label}
    >
      <rect width={matrix.size} height={matrix.size} fill="#fffaf1" />
      <path d={matrix.path} fill="currentColor" />
    </svg>
  );
}

import { CANONICAL_HOST } from "@/lib/config";
import { PAW_VIEWBOX, QR_QUIET_INSET, QR_SLOT } from "@/lib/paw-geometry";
import { qrMatrix } from "@/lib/qr";
import { PawPad, PawToes } from "@/components/paw/PawShapes";

type PawPrintProps = {
  scanUrl: string;
  className?: string;
  label?: string;
};

export function PawPrint({
  scanUrl,
  className,
  label = "BearGo paw with QR code",
}: PawPrintProps) {
  const qr = qrMatrix(scanUrl);
  const inner = QR_SLOT.size - QR_QUIET_INSET * 2;
  const scale = inner / qr.size;

  return (
    <svg
      viewBox={PAW_VIEWBOX}
      className={className}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <PawToes />
      <PawPad />
      <rect
        x={QR_SLOT.x}
        y={QR_SLOT.y}
        width={QR_SLOT.size}
        height={QR_SLOT.size}
        rx={QR_SLOT.rx}
        fill="#fffdf8"
      />
      <g
        transform={`translate(${QR_SLOT.x + QR_QUIET_INSET} ${QR_SLOT.y + QR_QUIET_INSET}) scale(${scale})`}
        fill="#1c140c"
      >
        <path d={qr.path} />
      </g>
    </svg>
  );
}

export function PawDomain({ className }: { className?: string }) {
  return <p className={className}>{CANONICAL_HOST}</p>;
}

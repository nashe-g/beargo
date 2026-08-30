import type { PourBand, PatronId } from "@/lib/pour";

const FACES: Record<
  PourBand,
  { mouth: "smile" | "grin" | "frown" | "shock"; brow: number; look: number }
> = {
  idle: { mouth: "smile", brow: 0, look: 0 },
  nail: { mouth: "grin", brow: -2, look: 0 },
  close: { mouth: "smile", brow: -1, look: 0 },
  short: { mouth: "frown", brow: 3, look: 2 },
  flood: { mouth: "shock", brow: 5, look: -2 },
};

function mouthPath(
  cx: number,
  cy: number,
  kind: "smile" | "grin" | "frown" | "shock",
) {
  if (kind === "grin") return `M${cx - 10} ${cy + 8}c6 11 14 11 20 0`;
  if (kind === "frown") return `M${cx - 8} ${cy + 12}c4-4 12-4 16 0`;
  if (kind === "shock") return `M${cx - 10} ${cy + 14}c8-9 16-9 24 0`;
  return `M${cx - 9} ${cy + 8}c5 7 13 7 18 0`;
}

export function Patron({
  id,
  reaction = "idle",
  className,
}: {
  id: PatronId;
  reaction?: PourBand;
  className?: string;
}) {
  const face = FACES[reaction];

  return (
    <svg
      viewBox="0 0 96 132"
      className={className}
      role="img"
      aria-label={`Patron ${id}, ${reaction}`}
    >
      <g className="patron-figure" data-reaction={reaction}>
        {id === "a" ? <PatronA face={face} /> : null}
        {id === "b" ? <PatronB face={face} /> : null}
        {id === "c" ? <PatronC face={face} /> : null}
      </g>
    </svg>
  );
}

function Face({
  cx,
  cy,
  brow,
  look,
  mouth,
}: {
  cx: number;
  cy: number;
  brow: number;
  look: number;
  mouth: "smile" | "grin" | "frown" | "shock";
}) {
  return (
    <g>
      <path
        d={`M${cx - 14} ${cy - 6 + brow}h8M${cx + 6} ${cy - 6 + brow}h8`}
        stroke="#1a120b"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx={cx - 8 + look} cy={cy} r="2.1" fill="#1a120b" />
      <circle cx={cx + 8 + look} cy={cy} r="2.1" fill="#1a120b" />
      <path
        d={mouthPath(cx, cy, mouth)}
        fill="none"
        stroke="#1a120b"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </g>
  );
}

function PatronA({
  face,
}: {
  face: { mouth: "smile" | "grin" | "frown" | "shock"; brow: number; look: number };
}) {
  return (
    <>
      <path
        d="M22 128c3-20 9-36 26-58 17 10 23 28 26 58z"
        fill="#e4d0ae"
      />
      <path
        d="M28 76c2 10 8 16 20 16s18-6 20-16c-8 6-32 6-40 0z"
        fill="#5a4634"
      />
      <path d="M43 58v8c0 4 3 7 5 7s5-3 5-7V58z" fill="#f4e4c8" />
      <ellipse cx="30" cy="46" rx="4" ry="6" fill="#f4e4c8" />
      <ellipse cx="66" cy="46" rx="4" ry="6" fill="#f4e4c8" />
      <circle cx="48" cy="44" r="18" fill="#f4e4c8" />
      <path
        d="M30 38c2-16 10-22 18-22s16 6 18 22c-4-8-12-10-18-10s-14 2-18 10z"
        fill="#1a120b"
      />
      <Face cx={48} cy={46} {...face} />
    </>
  );
}

function PatronB({
  face,
}: {
  face: { mouth: "smile" | "grin" | "frown" | "shock"; brow: number; look: number };
}) {
  return (
    <>
      <path
        d="M20 128c4-22 12-38 28-60 16 10 24 28 28 60z"
        fill="#e4d0ae"
      />
      <path
        d="M26 72c4 14 12 22 22 22s18-8 22-22c-10 8-34 8-44 0z"
        fill="#7c4f08"
      />
      <path d="M43 56v8c0 4 3 7 5 7s5-3 5-7V56z" fill="#f4e4c8" />
      <ellipse cx="30" cy="44" rx="4.2" ry="6.2" fill="#f4e4c8" />
      <ellipse cx="66" cy="44" rx="4.2" ry="6.2" fill="#f4e4c8" />
      <circle cx="48" cy="42" r="17.5" fill="#f4e4c8" />
      <path
        d="M28 36c4-16 12-24 20-24s16 8 20 24c-5-10-12-12-20-12s-15 2-20 12z"
        fill="#1a120b"
      />
      <path
        d="M14 70c8 18 12 40 10 58h8c2-16 0-34-6-50z"
        fill="#1a120b"
      />
      <path
        d="M82 70c-8 18-12 40-10 58h-8c-2-16 0-34 6-50z"
        fill="#1a120b"
      />
      <circle cx="70" cy="56" r="2.2" fill="#e8a31a" />
      <Face cx={48} cy={44} {...face} />
    </>
  );
}

function PatronC({
  face,
}: {
  face: { mouth: "smile" | "grin" | "frown" | "shock"; brow: number; look: number };
}) {
  return (
    <>
      <path
        d="M21 128c4-20 11-36 27-58 16 10 23 28 27 58z"
        fill="#e4d0ae"
      />
      <path
        d="M30 74c3 12 10 18 18 18s15-6 18-18c-8 7-28 7-36 0z"
        fill="#2c6a4a"
      />
      <path d="M43 56v8c0 4 3 7 5 7s5-3 5-7V56z" fill="#f4e4c8" />
      <circle cx="48" cy="40" r="22" fill="#1a120b" />
      <circle cx="28" cy="36" r="9" fill="#1a120b" />
      <circle cx="68" cy="36" r="9" fill="#1a120b" />
      <circle cx="34" cy="22" r="8" fill="#1a120b" />
      <circle cx="62" cy="22" r="8" fill="#1a120b" />
      <circle cx="48" cy="18" r="9" fill="#1a120b" />
      <ellipse cx="31" cy="44" rx="4" ry="5.5" fill="#f4e4c8" />
      <ellipse cx="65" cy="44" rx="4" ry="5.5" fill="#f4e4c8" />
      <circle cx="48" cy="44" r="16" fill="#f4e4c8" />
      <ellipse
        cx="40"
        cy="46"
        rx="7"
        ry="5.5"
        fill="none"
        stroke="#1a120b"
        strokeWidth="1.8"
      />
      <ellipse
        cx="56"
        cy="46"
        rx="7"
        ry="5.5"
        fill="none"
        stroke="#1a120b"
        strokeWidth="1.8"
      />
      <path d="M47 46h2" stroke="#1a120b" strokeWidth="1.6" />
      <Face cx={48} cy={46} {...face} />
    </>
  );
}

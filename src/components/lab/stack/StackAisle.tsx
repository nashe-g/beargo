import { Patron } from "@/components/lab/pour/Patron";
import type { PatronId, PourBand } from "@/lib/pour";
import {
  STACK,
  type StackDress,
  type StackFormation,
  type StackHazard,
  type StackJolt,
} from "@/lib/stack";

function clamp(value: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, value));
}

function Chair({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 56 72" className="h-full w-full" aria-hidden>
      <g transform={up ? "rotate(-28 28 36)" : undefined}>
        <rect x="10" y="8" width="36" height="28" rx="3" fill="#c4a574" />
        <rect x="14" y="36" width="28" height="6" fill="#8a6a3a" />
        <rect x="12" y="42" width="5" height="26" fill="#6e5330" />
        <rect x="38" y="42" width="5" height="26" fill="#6e5330" />
      </g>
    </svg>
  );
}

function Door({ side }: { side: -1 | 1 }) {
  return (
    <svg viewBox="0 0 40 88" className="h-full w-full" aria-hidden>
      <rect x="4" y="4" width="32" height="80" rx="2" fill="#5a4634" />
      <rect x="8" y="10" width="24" height="22" fill="#2a2118" opacity="0.45" />
      <circle cx={side < 0 ? 28 : 12} cy="48" r="3" fill="#e8a31a" />
    </svg>
  );
}

function Gown() {
  return (
    <svg viewBox="0 0 80 140" className="h-full w-full" aria-hidden>
      <ellipse cx="40" cy="26" rx="15" ry="17" fill="#f4e4c8" />
      <path
        d="M28 44c4-2 8-3 12-3s8 1 12 3l18 92H10z"
        fill="#fff8f2"
        stroke="#c96a88"
        strokeWidth="3"
      />
      <path d="M22 96c10 8 26 8 36 0" fill="#c96a88" />
      <path d="M32 44h16l-3 22h-10z" fill="#f4c4d0" />
      <ellipse cx="40" cy="24" rx="16" ry="8" fill="#1a120b" />
    </svg>
  );
}

function Tux() {
  return (
    <svg viewBox="0 0 80 140" className="h-full w-full" aria-hidden>
      <ellipse cx="40" cy="26" rx="15" ry="17" fill="#f4e4c8" />
      <path d="M24 48h32l4 88H20z" fill="#1a120b" />
      <path d="M36 48h8v88h-8z" fill="#fff8f2" />
      <path d="M28 48h8l-4 20h-6z" fill="#1a120b" />
      <path d="M44 48h8l6 20h-6z" fill="#1a120b" />
      <ellipse cx="40" cy="22" rx="15" ry="7" fill="#1a120b" />
    </svg>
  );
}

function RushBody() {
  return (
    <svg viewBox="0 0 130 92" className="h-full w-full" aria-hidden>
      <g stroke="rgba(255, 214, 110, 0.55)" strokeWidth="5" strokeLinecap="round">
        <path d="M4 26h34" />
        <path d="M0 46h26" />
        <path d="M6 66h32" />
      </g>
      <circle cx="86" cy="20" r="13" fill="#f4e4c8" />
      <path d="M74 16c2-8 10-12 16-10-4-6-14-6-18 0-2 3-2 7 2 10z" fill="#1a120b" />
      <path d="M70 32c12-2 24 2 30 10l-8 34-16-4 6-22-18-6z" fill="#7c4408" />
      <path d="M76 70L58 86l8 4 20-14z" fill="#5a3006" />
      <path d="M92 74l6 16 10-2-6-18z" fill="#5a3006" />
      <path d="M98 40l16 10-4 8-18-8z" fill="#7c4408" />
      <rect x="110" y="40" width="10" height="14" rx="2" fill="#e8a31a" stroke="#fff7df" strokeWidth="2" />
    </svg>
  );
}

function MopBucket() {
  return (
    <div className="stack-mop">
      <svg viewBox="0 0 60 90" className="h-full w-full" aria-hidden>
        <line
          x1="44"
          y1="4"
          x2="30"
          y2="58"
          stroke="#8a94a2"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M18 56h28l-5 30H23z" fill="#3a4450" />
        <ellipse cx="32" cy="56" rx="14" ry="4" fill="#5a6674" />
      </svg>
    </div>
  );
}

function PitShoulder() {
  return (
    <svg viewBox="0 0 90 110" className="h-full w-full" aria-hidden>
      <ellipse cx="45" cy="88" rx="42" ry="28" fill="#1a1016" />
      <circle cx="45" cy="38" r="24" fill="#2a1822" />
      <circle cx="38" cy="36" r="2.2" fill="#ffb0d0" />
      <circle cx="54" cy="36" r="2.2" fill="#ffb0d0" />
    </svg>
  );
}

function Body({
  kind,
  side,
  patronId,
  dress,
  reaction,
  look,
  index,
}: {
  kind: StackHazard;
  side: -1 | 1;
  patronId: PatronId;
  dress: StackDress;
  reaction: PourBand;
  look: "patron" | "rush" | "pit" | "guest";
  index: number;
}) {
  if (kind === "chair") return <Chair />;
  if (kind === "door") return <Door side={side} />;
  if (look === "pit") return <PitShoulder />;
  if (look === "guest") return index % 2 === 0 ? <Gown /> : <Tux />;
  return (
    <div
      className={`stack-cast stack-cast-${dress}${look === "rush" ? " is-rush" : ""}`}
    >
      <Patron id={patronId} reaction={reaction} className="h-full w-full" />
      {dress === "drink" ? <span className="stack-pint-hand" /> : null}
    </div>
  );
}

function packOffsets(formation: StackFormation, modifier: string) {
  if (modifier === "FRIDAY NIGHT") {
    return formation === "pair" ? [0, 16] : [0];
  }
  if (formation === "clump") return [-22, 0, 22];
  if (formation === "pair") return [-18, 18];
  return [0];
}

function pose(jolt: StackJolt, elapsed: number, modifier: string) {
  const t = (elapsed - (jolt.atMs - STACK.approachMs)) / STACK.approachMs;
  if (t < -0.08 || t > 1.42) return null;
  const near = clamp(t, 0, 1);
  const fade = t > 1.1 ? clamp(1 - (t - 1.1) / 0.32, 0, 1) : 1;
  const hit = t >= 0.86 && t <= 1.16;

  if (modifier === "HAPPY HOUR") {
    return {
      top: 26 + Math.sin(near * Math.PI) * 6,
      x: jolt.side * (62 - near * 124),
      scale: 0.9 + near * 0.35,
      fade,
      hit,
      near,
    };
  }
  if (modifier === "FRIDAY NIGHT") {
    return {
      top: 18 + near * 14,
      x: jolt.side * (46 - near * 28),
      scale: 1.15 + near * 0.4,
      fade,
      hit,
      near,
    };
  }
  if (modifier === "CLOSING TIME") {
    return {
      top: 8 + near * 34,
      x: Math.sin(near * Math.PI * 2.5) * 34 * jolt.side,
      scale: 0.2 + near * 1.25,
      fade,
      hit,
      near,
    };
  }
  if (modifier === "WEDDING PARTY") {
    return {
      top: 10 + near * 30,
      x: jolt.side * 4,
      scale: 0.42 + near * 1.05,
      fade,
      hit,
      near,
    };
  }
  let x = 0;
  if (jolt.kind === "cut") x = jolt.side * (52 - near * 88);
  else if (jolt.kind === "chair") x = jolt.side * (40 - near * 24);
  else if (jolt.kind === "door") x = jolt.side * (50 - near * 20);
  else x = jolt.side * (10 + (1 - near) * 8);
  return { top: 8 + near * 34, x, scale: 0.34 + near * 1.2, fade, hit, near };
}

function lookOf(modifier: string): "patron" | "rush" | "pit" | "guest" {
  if (modifier === "FRIDAY NIGHT") return "pit";
  if (modifier === "WEDDING PARTY") return "guest";
  if (modifier === "HAPPY HOUR") return "rush";
  return "patron";
}

const CROWD_IDS: PatronId[] = ["a", "b", "c"];

function RegularWorld() {
  return (
    <>
      <div className="stack-lamp" />
      <div className="stack-shelf" />
    </>
  );
}

function HappyWorld() {
  return (
    <>
      <div className="stack-streaks" />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className={`stack-rush${index % 2 === 1 ? " is-flip" : ""}`}
          style={{
            top: `${14 + index * 9}%`,
            animationDelay: `${-index * 0.85}s`,
            animationDuration: `${2.4 + (index % 3) * 0.55}s`,
          }}
        >
          <RushBody />
        </div>
      ))}
      <p className="stack-far-sign stack-far-gold">$5 POURS</p>
    </>
  );
}

function PitBlob({
  top,
  left,
  size,
  delay,
  inward,
}: {
  top: string;
  left: string;
  size: string;
  delay: string;
  inward?: "left" | "right";
}) {
  return (
    <div
      className={`stack-pit-blob${inward === "right" ? " is-right" : ""}`}
      style={{
        top,
        left,
        width: size,
        height: `calc(${size} * 1.15)`,
        animationDelay: delay,
      }}
    >
      <PitShoulder />
    </div>
  );
}

function FridayWorld() {
  const left = [
    { top: "6%", left: "0%", size: "5.2rem", delay: "0s" },
    { top: "16%", left: "8%", size: "6.4rem", delay: "-0.4s" },
    { top: "28%", left: "-2%", size: "7.2rem", delay: "-0.8s" },
    { top: "38%", left: "10%", size: "5.8rem", delay: "-0.2s" },
  ];
  const right = [
    { top: "8%", left: "78%", size: "5.4rem", delay: "-0.3s" },
    { top: "18%", left: "70%", size: "6.8rem", delay: "-0.7s" },
    { top: "30%", left: "80%", size: "7.4rem", delay: "-0.1s" },
    { top: "40%", left: "68%", size: "5.6rem", delay: "-0.5s" },
  ];
  return (
    <>
      <div className="stack-strobe" />
      {left.map((blob) => (
        <PitBlob key={`l-${blob.top}`} {...blob} inward="left" />
      ))}
      {right.map((blob) => (
        <PitBlob key={`r-${blob.top}`} {...blob} inward="right" />
      ))}
      <p className="stack-far-sign stack-far-neon">LIVE</p>
    </>
  );
}

function ClosingWorld() {
  return (
    <>
      <div className="stack-window" />
      <div className="stack-moonbeam" />
      <div className="stack-cord">
        <span className="stack-bare-bulb" />
      </div>
      <MopBucket />
      <div className="stack-chair-stack stack-chair-stack-left">
        <Chair up />
        <Chair up />
        <Chair />
      </div>
      <div className="stack-chair-stack stack-chair-stack-right">
        <Chair up />
        <Chair />
      </div>
      <p className="stack-far-sign stack-far-dim">LAST CALL</p>
    </>
  );
}

function Guest({
  kind,
  top,
  left,
  size,
}: {
  kind: "gown" | "tux";
  top: string;
  left: string;
  size: string;
}) {
  return (
    <div className="stack-guest" style={{ top, left, width: size, height: `calc(${size} * 1.7)` }}>
      {kind === "gown" ? <Gown /> : <Tux />}
    </div>
  );
}

function WeddingWorld() {
  return (
    <>
      <div className="stack-runner" />
      <div className="stack-arch" />
      <Guest kind="gown" top="10.5%" left="45%" size="1.5rem" />
      <Guest kind="tux" top="10.5%" left="51%" size="1.5rem" />
      <Guest kind="tux" top="14%" left="24%" size="2.4rem" />
      <Guest kind="gown" top="20%" left="17%" size="2.9rem" />
      <Guest kind="tux" top="27%" left="9%" size="3.5rem" />
      <Guest kind="gown" top="14%" left="68%" size="2.4rem" />
      <Guest kind="tux" top="20%" left="75%" size="2.9rem" />
      <Guest kind="gown" top="27%" left="82%" size="3.5rem" />
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={index}
          className="stack-petal"
          style={{
            left: `${8 + index * 9}%`,
            animationDelay: `${-index * 0.4}s`,
            animationDuration: `${2.6 + (index % 3) * 0.5}s`,
          }}
        />
      ))}
    </>
  );
}

function World({ modifier }: { modifier: string }) {
  if (modifier === "HAPPY HOUR") return <HappyWorld />;
  if (modifier === "FRIDAY NIGHT") return <FridayWorld />;
  if (modifier === "CLOSING TIME") return <ClosingWorld />;
  if (modifier === "WEDDING PARTY") return <WeddingWorld />;
  return <RegularWorld />;
}

export function StackAisle({
  elapsed,
  jolts,
  walking,
  modifier = "REGULAR SHIFT",
}: {
  elapsed: number;
  jolts: StackJolt[];
  walking?: boolean;
  bank?: number;
  modifier?: string;
}) {
  void walking;
  const look = lookOf(modifier);
  const hitting = jolts.some((jolt) => {
    const dt = elapsed - jolt.atMs;
    return dt >= 0 && dt <= 280;
  });

  return (
    <div
      className={`stack-room pointer-events-none${hitting ? " is-hit" : ""}`}
      data-shift={modifier}
    >
      <div className="stack-room-glow" />
      <div className="stack-room-floor" />
      <World modifier={modifier} />
      {jolts.map((jolt) => {
        const next = pose(jolt, elapsed, modifier);
        if (!next) return null;
        const reaction: PourBand = next.hit
          ? "flood"
          : next.near > 0.55
            ? "close"
            : "idle";
        return packOffsets(jolt.formation, modifier).map((offset, index) => {
          const x = clamp(next.x + offset, -46, 46);
          return (
            <div
              key={`${jolt.atMs}-${jolt.kind}-${index}`}
              className={`stack-oncoming stack-oncoming-${look}${next.hit ? " is-hit" : ""}`}
              style={{
                top: `${next.top + index * 1.1}%`,
                left: `calc(50% + ${x}%)`,
                opacity: next.fade,
                transform: `translate(-50%, 0) scale(${next.scale * (index === 0 ? 1 : 0.86)})`,
                zIndex: 3 + Math.round(next.scale * 8) - index,
              }}
            >
              <Body
                kind={jolt.kind}
                side={jolt.side}
                patronId={
                  index === 0
                    ? jolt.patronId
                    : CROWD_IDS[(CROWD_IDS.indexOf(jolt.patronId) + index) % 3]!
                }
                dress={jolt.dress}
                reaction={reaction}
                look={look}
                index={index}
              />
            </div>
          );
        });
      })}
    </div>
  );
}

/**
 * Looking down at the tray in your hands. Glasses sit on it in a cluster —
 * not a side-on tower. Lean is the plate tipping; drinks slide to the low rim.
 */

const CLUSTER: Record<number, { x: number; y: number }[]> = {
  3: [
    { x: -28, y: -10 },
    { x: 28, y: -10 },
    { x: 0, y: 18 },
  ],
  4: [
    { x: -26, y: -14 },
    { x: 26, y: -14 },
    { x: -24, y: 16 },
    { x: 24, y: 16 },
  ],
  5: [
    { x: 0, y: -20 },
    { x: -30, y: -6 },
    { x: 30, y: -6 },
    { x: -20, y: 18 },
    { x: 20, y: 18 },
  ],
};

function Glass({
  x,
  y,
  theta,
  toppled,
  index,
  hit,
  flute,
}: {
  x: number;
  y: number;
  theta: number;
  toppled?: boolean;
  index: number;
  hit: number;
  flute?: boolean;
}) {
  const slide = theta * 42 + hit * 10;
  const tip = theta * 28 + hit * 6;
  const slosh = Math.max(-12, Math.min(12, theta * 18 + hit * 9));
  const fallX = (x + slide) * 2.4;
  const fallY = 70 + index * 8;

  return (
    <div
      className={`tray-pint${flute ? " is-flute" : ""}${toppled ? " tray-pint-down" : ""}`}
      style={{
        left: `calc(50% + ${x}%)`,
        top: `calc(42% + ${y}%)`,
        transform: toppled
          ? undefined
          : `translate(-50%, -70%) translate(${slide}px, ${Math.abs(theta) * 10}px) rotate(${tip}deg)`,
        ["--fall-x" as string]: `${fallX}px`,
        ["--fall-y" as string]: `${fallY}px`,
        ["--fall-r" as string]: `${tip + (x >= 0 ? 38 : -38)}deg`,
        animationDelay: toppled ? `${index * 70}ms` : undefined,
        zIndex: 4 + Math.round((y + 24) / 8),
      }}
    >
      {flute ? (
        <>
          <div className="tray-flute-stem" />
          <div className="tray-flute-foot" />
        </>
      ) : null}
      <div className="tray-pint-body">
        <div className="tray-pint-beer" style={{ ["--slosh" as string]: `${slosh}px` }} />
        <div className="tray-pint-foam" style={{ ["--slosh" as string]: `${slosh}px` }} />
      </div>
      <div className="tray-pint-rim" />
    </div>
  );
}

export function StackTray({
  glasses,
  theta,
  toppled,
  hit = 0,
  modifier = "REGULAR SHIFT",
}: {
  glasses: number;
  theta: number;
  slide?: number;
  toppled?: boolean;
  hit?: number;
  modifier?: string;
}) {
  const spots = CLUSTER[glasses] ?? CLUSTER[3];
  const deg = (theta * 180) / Math.PI;
  const bank = Math.max(-22, Math.min(22, deg * 0.85 + hit * 4));
  const flute = modifier === "WEDDING PARTY";

  return (
    <div className="stack-hands">
      <div className="stack-grip stack-grip-left" aria-hidden>
        <span className="stack-thumb" />
      </div>
      <div className="stack-grip stack-grip-right" aria-hidden>
        <span className="stack-thumb" />
      </div>
      <div
        className={`stack-plate ${toppled ? "stack-plate-down" : ""} ${hit ? "is-hit" : ""}`}
        style={{ transform: `rotateZ(${bank}deg) rotateX(58deg)` }}
      >
        <div className="stack-plate-lip" />
        <div className="stack-plate-well" />
      </div>
      <div
        className="stack-pints"
        style={{ transform: `rotateZ(${bank}deg)` }}
      >
        {spots.map((spot, index) => (
          <Glass
            key={index}
            x={spot.x}
            y={spot.y}
            theta={theta}
            toppled={toppled}
            index={index}
            hit={hit}
            flute={flute}
          />
        ))}
      </div>
    </div>
  );
}

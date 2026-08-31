import { VESSELS } from "@/lib/pour";
import { stackSpill, stackTopple } from "@/lib/stack";

const PINT = VESSELS.pint;
const SCALE = 0.33;
const STEP = 50;
const CX = 80;
const BASE_Y = 386;
const FOOT = 220 * SCALE;

/** Beer flying out of the wreck. Fixed table keeps the chaos deterministic. */
const SPLASH_DROPS = [
  { sx: -36, sy: -34, r: 3, delay: 0 },
  { sx: 28, sy: -46, r: 2.4, delay: 40 },
  { sx: -16, sy: -58, r: 2, delay: 80 },
  { sx: 44, sy: -20, r: 2.8, delay: 20 },
  { sx: -50, sy: -10, r: 2.2, delay: 60 },
  { sx: 14, sy: -66, r: 1.8, delay: 100 },
  { sx: 52, sy: -44, r: 1.6, delay: 120 },
];

function MiniPint({
  index,
  glasses,
  theta,
  toppled,
}: {
  index: number;
  glasses: number;
  theta: number;
  toppled: boolean;
}) {
  const y = BASE_Y - FOOT - index * STEP;
  const lean = index % 2 === 0 ? 1 : -1;
  const fallX = lean * (22 + (glasses - 1 - index) * 11);
  const fallR = lean * (30 + (glasses - 1 - index) * 14);
  const shear = Math.sin(theta) * index * 4.2;

  return (
    <g
      transform={`translate(${CX + shear} ${y}) scale(${SCALE}) translate(${-CX} 0)`}
    >
      <g
        className="stack-glass"
        style={{
          ["--fall-x" as string]: `${fallX}px`,
          ["--fall-r" as string]: `${fallR}deg`,
          animationDelay: toppled ? `${index * 55}ms` : undefined,
        }}
      >
        <path d={PINT.interior} fill="#e8a31a" opacity={0.92} />
        <ellipse
          cx={PINT.streamX}
          cy={PINT.fillTop + 10}
          rx={PINT.fillWidth * 0.38}
          ry={7}
          fill="#fffdf8"
          opacity={0.88}
        />
        <path
          d={PINT.outline}
          fill="none"
          stroke="#f6efe4"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

export function StackGlasses({
  glasses,
  theta,
  slide = 0,
  toppled,
  className,
}: {
  glasses: number;
  theta: number;
  slide?: number;
  toppled?: boolean;
  className?: string;
}) {
  const deg = (theta * 180) / Math.PI;
  const mark = (stackTopple(glasses) * 180) / Math.PI;
  const spilling = !toppled && Math.abs(theta) >= stackSpill(glasses);
  const side = theta >= 0 ? 1 : -1;
  const trayX = slide * 22;
  const trayTilt = deg * 0.14;

  return (
    <svg
      viewBox="0 0 160 420"
      className={className}
      role="img"
      aria-label={`${glasses} pints, ${toppled ? "down" : "standing"}`}
    >
      <line
        x1={CX}
        y1={BASE_Y}
        x2={CX + Math.sin((-mark * Math.PI) / 180) * 210}
        y2={BASE_Y - Math.cos((-mark * Math.PI) / 180) * 210}
        stroke="#f6efe4"
        strokeOpacity={0.12}
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <line
        x1={CX}
        y1={BASE_Y}
        x2={CX + Math.sin((mark * Math.PI) / 180) * 210}
        y2={BASE_Y - Math.cos((mark * Math.PI) / 180) * 210}
        stroke="#f6efe4"
        strokeOpacity={0.12}
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <g
        className={toppled ? "stack-crash" : undefined}
        style={{
          transform: `translate(${trayX}px)`,
        }}
      >
        <g
          style={{
            transformOrigin: `${CX}px ${BASE_Y}px`,
            transform: `rotate(${deg}deg)`,
          }}
        >
          {Array.from({ length: glasses }, (_, index) => (
            <MiniPint
              key={index}
              index={index}
              glasses={glasses}
              theta={theta}
              toppled={Boolean(toppled)}
            />
          ))}
          {spilling ? (
            <g
              className="stack-drip"
              transform={`translate(${CX + side * 16} ${BASE_Y - glasses * STEP + 10})`}
            >
              <circle cx={0} cy={0} r="2.2" fill="#e8a31a" />
              <circle cx={side * 4} cy={7} r="1.6" fill="#e8a31a" opacity={0.7} />
            </g>
          ) : null}
        </g>
        {toppled ? (
          <g
            transform={`translate(${CX} ${BASE_Y - FOOT - (glasses - 1) * STEP})`}
          >
            {SPLASH_DROPS.map((drop, index) => (
              <circle
                key={index}
                className="stack-splash-drop"
                r={drop.r}
                fill="#e8a31a"
                style={{
                  ["--sx" as string]: `${drop.sx}px`,
                  ["--sy" as string]: `${drop.sy}px`,
                  animationDelay: `${drop.delay}ms`,
                }}
              />
            ))}
          </g>
        ) : null}
        <g
          className="stack-tray"
          style={{
            transformOrigin: `${CX}px ${BASE_Y}px`,
            transform: `rotate(${trayTilt}deg)`,
          }}
        >
          <ellipse
            cx={CX}
            cy={BASE_Y + 2}
            rx={46}
            ry={11}
            fill="#8a6a3a"
          />
          <ellipse
            cx={CX}
            cy={BASE_Y - 4}
            rx={48}
            ry={10}
            fill="#c4a574"
          />
          <path
            d="M24 378c-10 6-14 18-6 24 6 4 16 2 22-6"
            fill="none"
            stroke="#e8c9a0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M136 378c10 6 14 18 6 24-6 4-16 2-22-6"
            fill="none"
            stroke="#e8c9a0"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}

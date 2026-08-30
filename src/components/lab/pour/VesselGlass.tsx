import { useId } from "react";
import {
  POUR_FILL_CAP,
  POUR_STREAM,
  foamTopY,
  liquidY,
  targetY,
  type VesselSpec,
} from "@/lib/pour";

const FOAM_BUBBLES = [
  { dx: -0.32, dy: 0.28, r: 2.4 },
  { dx: -0.14, dy: 0.12, r: 1.5 },
  { dx: 0.04, dy: 0.38, r: 2.8 },
  { dx: 0.22, dy: 0.18, r: 1.7 },
  { dx: 0.36, dy: 0.48, r: 2.1 },
  { dx: -0.22, dy: 0.58, r: 1.4 },
  { dx: 0.12, dy: 0.68, r: 1.9 },
  { dx: -0.04, dy: 0.5, r: 1.2 },
] as const;

function FoamHead({
  spec,
  beerY,
  foam,
  fillId,
}: {
  spec: VesselSpec;
  beerY: number;
  foam: number;
  fillId: string;
}) {
  const span = spec.fillBottom - spec.fillTop;
  const desired = Math.max(0, foam) * span;
  if (desired < 3) return null;
  const foamH = Math.min(desired, Math.max(0, beerY - (spec.fillTop - 6)));
  if (foamH < 3) return null;
  const top = beerY - foamH;
  const cx = spec.streamX;
  const rx = spec.fillWidth * 0.46;

  return (
    <g className="pour-foam">
      <rect
        x={spec.fillX - 4}
        y={top}
        width={spec.fillWidth + 8}
        height={foamH}
        fill={`url(#${fillId})`}
      />
      <ellipse
        cx={cx}
        cy={top + Math.max(2.5, foamH * 0.12)}
        rx={rx}
        ry={Math.max(3, foamH * 0.22)}
        fill="#fffdf8"
        opacity={0.95}
      />
      <ellipse
        cx={cx - rx * 0.28}
        cy={top + foamH * 0.28}
        rx={rx * 0.22}
        ry={foamH * 0.12}
        fill="#fffef9"
        opacity={0.5}
      />
      {FOAM_BUBBLES.map((bubble) => (
        <circle
          key={`${bubble.dx}-${bubble.dy}`}
          className="pour-bubble"
          cx={cx + bubble.dx * spec.fillWidth}
          cy={top + bubble.dy * foamH}
          r={bubble.r}
          fill="#fffef9"
          stroke="#e8d4a8"
          strokeWidth={0.6}
          opacity={0.9}
        />
      ))}
      <rect
        x={spec.fillX - 4}
        y={beerY - 2}
        width={spec.fillWidth + 8}
        height={3}
        fill="#c99218"
        opacity={0.55}
      />
    </g>
  );
}

function PourStream({
  spec,
  y0,
  y1,
}: {
  spec: VesselSpec;
  y0: number;
  y1: number;
}) {
  if (y1 - y0 < 8) return null;
  const cx = spec.streamX;
  const topW = POUR_STREAM.topWidth / 2;
  const botW = POUR_STREAM.bottomWidth / 2;
  return (
    <g className="pour-stream">
      <path
        d={`M${cx - topW} ${y0} L${cx - botW} ${y1} L${cx + botW} ${y1} L${cx + topW} ${y0} Z`}
        fill="#e8a31a"
        opacity={0.94}
      />
      <ellipse
        className="pour-impact"
        cx={cx}
        cy={y1}
        rx={botW + 4}
        ry={2.4}
        fill="#f6d98a"
        opacity={0.8}
      />
    </g>
  );
}

export function VesselGlass({
  spec,
  fill,
  foam = 0,
  target,
  pouring = false,
  streamCut = 0,
  zoomed = false,
  reveal = false,
  className,
}: {
  spec: VesselSpec;
  fill: number;
  foam?: number;
  target: number;
  pouring?: boolean;
  streamCut?: number;
  zoomed?: boolean;
  reveal?: boolean;
  className?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  const gradId = `${clipId}-liq`;
  const foamId = `${clipId}-foam`;
  const beerY = liquidY(spec, fill);
  const headY = foamTopY(spec, fill, foam);
  const mark = targetY(spec, target);
  const spilled = fill > 1;
  const holdFill = Math.min(Math.max(fill, 0), POUR_FILL_CAP);
  const showFoam = foam > 0.02 && holdFill > 0.02;
  const focusY = (beerY + mark) / 2;
  const streamY0 = POUR_STREAM.tapY + streamCut * (headY - POUR_STREAM.tapY);
  const missX = spec.fillX + spec.fillWidth + 8;

  return (
    <svg
      viewBox={spec.viewBox}
      className={`pour-glass ${zoomed ? "pour-glass-zoom" : ""} ${className ?? ""}`}
      style={{ transformOrigin: `50% ${(focusY / 260) * 100}%` }}
      role="img"
      aria-label={`${spec.label}, target ${Math.round(target * 100)} percent`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={spec.interior} />
        </clipPath>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={showFoam ? "#e0b03a" : "#f3c45a"} />
          <stop offset="55%" stopColor="#e8a31a" />
          <stop offset="100%" stopColor="#c4840a" />
        </linearGradient>
        {showFoam ? (
          <linearGradient id={foamId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="45%" stopColor="#f3ead8" />
            <stop offset="100%" stopColor="#e4d0a4" />
          </linearGradient>
        ) : null}
      </defs>

      {spec.foot ? (
        <path d={spec.foot} fill="#f4e4c8" fillOpacity="0.18" />
      ) : null}
      {spec.stem ? (
        <path d={spec.stem} fill="#f4e4c8" fillOpacity="0.22" />
      ) : null}

      {pouring ? (
        <PourStream spec={spec} y0={streamY0} y1={Math.max(streamY0 + 8, headY)} />
      ) : null}

      <g clipPath={`url(#${clipId})`}>
        <path d={spec.interior} fill="#fffaf1" fillOpacity="0.06" />
        {holdFill > 0.004 ? (
          <>
            <rect
              x={spec.fillX - 4}
              y={beerY}
              width={spec.fillWidth + 8}
              height={spec.fillBottom - beerY + 8}
              fill={`url(#${gradId})`}
            />
            {showFoam ? (
              <FoamHead spec={spec} beerY={beerY} foam={foam} fillId={foamId} />
            ) : (
              <ellipse
                cx={spec.streamX}
                cy={beerY + 1}
                rx={spec.fillWidth * 0.42}
                ry={4}
                fill="#f6d98a"
                opacity={0.85}
              />
            )}
          </>
        ) : null}
      </g>

      {spilled ? (
        <g fill="#e8a31a" opacity={0.9}>
          <ellipse
            className="pour-drip"
            cx={spec.fillX + 6}
            cy={spec.rimY + 8}
            rx={5}
            ry={7}
          />
          <ellipse
            className="pour-drip pour-drip-delay"
            cx={spec.fillX + spec.fillWidth - 6}
            cy={spec.rimY + 10}
            rx={4.5}
            ry={6}
          />
        </g>
      ) : null}

      {spilled ? (
        <path
          d={`M${spec.fillX + 10} ${spec.rimY - 2}c8-8 ${spec.fillWidth - 28} -8 ${spec.fillWidth - 20} 0`}
          fill="none"
          stroke="#e8a31a"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}

      <path
        d={spec.outline}
        fill="none"
        stroke="#f4e4c8"
        strokeWidth={2.6}
        strokeLinejoin="round"
        opacity={0.92}
      />
      {spec.stem ? (
        <path d={spec.stem} fill="none" stroke="#f4e4c8" strokeWidth={2.2} />
      ) : null}
      {spec.foot ? (
        <path
          d={spec.foot}
          fill="none"
          stroke="#f4e4c8"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      ) : null}

      <line
        x1={spec.fillX + 4}
        x2={spec.fillX + spec.fillWidth - 4}
        y1={mark}
        y2={mark}
        stroke="#e8a31a"
        strokeWidth={reveal ? 3.2 : 2.4}
        strokeLinecap="round"
      />
      <polygon
        points={`${spec.fillX},${mark} ${spec.fillX + 7},${mark - 4} ${spec.fillX + 7},${mark + 4}`}
        fill="#e8a31a"
      />
      <polygon
        points={`${spec.fillX + spec.fillWidth},${mark} ${spec.fillX + spec.fillWidth - 7},${mark - 4} ${spec.fillX + spec.fillWidth - 7},${mark + 4}`}
        fill="#e8a31a"
      />

      {reveal ? (
        <g className="pour-miss" stroke="#fffaf1" strokeWidth={1.8} fill="none">
          <line
            x1={spec.fillX + 6}
            x2={spec.fillX + spec.fillWidth - 6}
            y1={beerY}
            y2={beerY}
            strokeLinecap="round"
            opacity={0.9}
          />
          <line x1={missX} y1={beerY} x2={missX} y2={mark} />
          <line x1={missX - 4} y1={beerY} x2={missX + 4} y2={beerY} />
          <line x1={missX - 4} y1={mark} x2={missX + 4} y2={mark} />
        </g>
      ) : null}
    </svg>
  );
}

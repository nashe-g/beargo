import { type BearState } from "@/lib/bear";
import "./bear-guide.css";

type BearGuideProps = {
  state: BearState;
  tone?: "onDark" | "onPaper";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "w-16",
  md: "w-24",
  lg: "w-32",
} as const;

export function BearGuide({
  state,
  tone = "onDark",
  size = "md",
  className = "",
}: BearGuideProps) {
  const fur = tone === "onDark" ? "#f3e6d0" : "#1c140c";
  const snout = tone === "onDark" ? "#e6d3b4" : "#4a3b2c";
  const ink = tone === "onDark" ? "#1c140c" : "#f3e6d0";
  const honey = "#e3a012";
  const eyeWhite = tone === "onDark" ? "#fffdf8" : "#f3e6d0";

  return (
    <svg
      viewBox="0 0 160 176"
      className={`bear-guide ${SIZE_CLASS[size]} ${className}`}
      data-state={state}
      data-tone={tone}
      role="img"
      aria-hidden="true"
    >
      <g className="bear-root">
        <ellipse cx="80" cy="158" rx="42" ry="16" fill={fur} opacity="0.35" />
        <path
          d="M38 128c8 22 96 22 84 0 6-18-10-28-42-28s-48 10-42 28z"
          fill={fur}
        />
        <g className="head">
          <ellipse cx="42" cy="48" rx="18" ry="16" fill={fur} />
          <ellipse cx="118" cy="48" rx="18" ry="16" fill={fur} />
          <ellipse cx="42" cy="50" rx="9" ry="8" fill={honey} />
          <ellipse cx="118" cy="50" rx="9" ry="8" fill={honey} />
          <circle cx="80" cy="86" r="48" fill={fur} />
          <ellipse cx="80" cy="102" rx="28" ry="20" fill={snout} />
          <ellipse cx="80" cy="94" rx="10" ry="7" fill={ink} />
          <g className="eye eye-left">
            <ellipse cx="62" cy="78" rx="9" ry="10" fill={eyeWhite} />
            <circle className="pupil" cx="63" cy="80" r="4.5" fill={ink} />
            <path
              className="eye-lid"
              d="M53 78c6-10 16-10 18 0"
              fill="none"
              stroke={fur}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
          <g className="eye eye-right">
            <ellipse cx="98" cy="78" rx="9" ry="10" fill={eyeWhite} />
            <circle className="pupil" cx="97" cy="80" r="4.5" fill={ink} />
            <path
              className="eye-lid"
              d="M89 78c6-10 16-10 18 0"
              fill="none"
              stroke={fur}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
          <path
            className="mouth mouth-idle"
            d="M70 116h20"
            fill="none"
            stroke={ink}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="mouth mouth-smile"
            d="M66 114c6 10 22 10 28 0"
            fill="none"
            stroke={ink}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="mouth mouth-happy"
            d="M64 112c8 14 24 14 32 0"
            fill="none"
            stroke={ink}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <ellipse
            className="mouth mouth-oh"
            cx="80"
            cy="118"
            rx="6"
            ry="7"
            fill={ink}
          />
        </g>
        <circle className="sparkle" cx="22" cy="40" r="4" fill={honey} />
        <circle className="sparkle" cx="138" cy="36" r="3" fill={honey} />
        <circle className="sparkle" cx="148" cy="72" r="2.5" fill={honey} />
      </g>
    </svg>
  );
}

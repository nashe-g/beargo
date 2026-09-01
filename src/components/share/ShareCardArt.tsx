import { PAD_PATH, TOE_PATHS } from "@/lib/paw-geometry";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import {
  shareCardHeadline,
  type ShareCardStats,
} from "@/lib/share-card";
import { formatWobble } from "@/lib/stack";

const INK = "#1a120b";
const PAPER = "#f4e4c8";
const HONEY = "#e8a31a";
const SOFT = "rgba(244, 228, 200, 0.62)";

export function SharePawMark({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill={HONEY}
    >
      {TOE_PATHS.map((toe) => (
        <path key={toe.id} d={toe.d} />
      ))}
      <path d={PAD_PATH} />
    </svg>
  );
}

export function ShareCardArt({
  host,
  stats,
  width = 1200,
  height = 630,
}: {
  host: string;
  stats: ShareCardStats | null;
  width?: number;
  height?: number;
}) {
  const ranked = Boolean(stats && stats.rank > 0 && stats.playerCount > 0);
  const name = stats?.boardName;
  const score = stats
    ? `${stats.correctCount} / ${QUESTIONS_PER_CHALLENGE}   ·   WOBBLE ${formatWobble(stats.stackWobble)}`
    : "Don’t drop the drinks.";

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        backgroundImage:
          "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(232, 163, 26, 0.22), transparent 58%)",
        color: PAPER,
        padding: "56px 64px 48px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Arial, sans-serif",
              fontSize: 22,
              letterSpacing: "0.28em",
              color: HONEY,
              fontWeight: 700,
            }}
          >
            BEARGO
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 28,
              color: SOFT,
            }}
          >
            {host}
          </div>
        </div>
        <SharePawMark size={120} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {name ? (
          <div
            style={{
              display: "flex",
              fontFamily: "Arial, sans-serif",
              fontSize: 22,
              letterSpacing: "0.18em",
              color: HONEY,
              textTransform: "uppercase",
            }}
          >
            {name}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginTop: name ? 8 : 0,
            fontSize: ranked ? 132 : 72,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
          }}
        >
          {shareCardHeadline(stats)}
          {ranked && stats ? (
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                fontSize: 42,
                color: SOFT,
              }}
            >
              of {stats.playerCount}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontFamily: "Arial, sans-serif",
            fontSize: 28,
            letterSpacing: "0.12em",
            color: PAPER,
          }}
        >
          {score}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontFamily: "Arial, sans-serif",
          fontSize: 20,
          letterSpacing: "0.16em",
          color: HONEY,
        }}
      >
        <div style={{ display: "flex" }}>
          THE PAW KNOWS HOW LONG YOU’D LAST
        </div>
        <div style={{ display: "flex", letterSpacing: "0.22em" }}>ASK IT.</div>
      </div>
    </div>
  );
}

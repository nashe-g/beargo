import { StackAisle } from "@/components/lab/stack/StackAisle";
import { StackTray } from "@/components/lab/stack/StackTray";
import type { StackJolt } from "@/lib/stack";

function TapZone({
  side,
  hint,
  pressed,
  disabled,
  onDown,
  onUp,
}: {
  side: -1 | 1;
  hint?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={side < 0 ? "Catch left" : "Catch right"}
      disabled={disabled}
      className={`stack-zone ${side < 0 ? "stack-zone-left" : "stack-zone-right"} ${pressed ? "stack-zone-on" : ""}`}
      onPointerDown={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <span
        className={`stack-zone-arrow ${hint ? "stack-arrow-hint" : ""} ${pressed ? "stack-arrow-on" : ""}`}
        style={
          hint
            ? { ["--nudge" as string]: side < 0 ? "-6px" : "6px" }
            : undefined
        }
      >
        <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
          <path
            d={side < 0 ? "M30 10L14 24l16 14" : "M18 10l16 14-16 14"}
            fill="none"
            stroke="currentColor"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={`text-[0.65rem] font-condensed tracking-[0.18em] ${hint ? "text-honey" : "opacity-80"}`}
        >
          TAP
        </span>
      </span>
    </button>
  );
}

export function StackPlayfield({
  glasses,
  theta,
  slide,
  toppled,
  fallen = [],
  hintSide = 0,
  pressedSide = 0,
  disabled,
  elapsed = 0,
  jolts = [],
  walking = false,
  modifier = "REGULAR SHIFT",
  onPress,
  onRelease,
}: {
  glasses: number;
  theta: number;
  slide?: number;
  toppled?: boolean;
  fallen?: number[];
  hintSide?: -1 | 0 | 1;
  pressedSide?: -1 | 0 | 1;
  disabled?: boolean;
  elapsed?: number;
  jolts?: StackJolt[];
  walking?: boolean;
  modifier?: string;
  onPress: (side: -1 | 1) => void;
  onRelease: () => void;
}) {
  void slide;
  const hitting = jolts.find((jolt) => {
    const dt = elapsed - jolt.atMs;
    return dt >= 0 && dt <= 280;
  });
  const hit = hitting ? hitting.side : 0;
  return (
    <div
      className="stack-field relative flex min-h-[26rem] flex-1"
      data-shift={modifier}
    >
      <StackAisle
        elapsed={elapsed}
        jolts={jolts}
        walking={walking}
        modifier={modifier}
      />
      <StackTray
        glasses={glasses}
        theta={theta}
        toppled={toppled}
        fallen={fallen}
        hit={hit}
        modifier={modifier}
      />
      <TapZone
        side={-1}
        hint={hintSide === -1}
        pressed={pressedSide === -1}
        disabled={disabled}
        onDown={() => onPress(-1)}
        onUp={onRelease}
      />
      <TapZone
        side={1}
        hint={hintSide === 1}
        pressed={pressedSide === 1}
        disabled={disabled}
        onDown={() => onPress(1)}
        onUp={onRelease}
      />
    </div>
  );
}

import { StackGlasses } from "@/components/lab/stack/StackGlasses";

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
          className={`text-[0.65rem] font-condensed tracking-[0.18em] ${hint ? "text-honey" : "text-paper/35"}`}
        >
          TAP
        </span>
      </span>
    </button>
  );
}

/**
 * The whole left/right half of the playfield is a touch target — a
 * bar-friendly control that works one-handed after a drink. The arrows
 * are indicators, not buttons.
 */
export function StackPlayfield({
  glasses,
  theta,
  slide,
  toppled,
  hintSide = 0,
  pressedSide = 0,
  disabled,
  onPress,
  onRelease,
}: {
  glasses: number;
  theta: number;
  slide?: number;
  toppled?: boolean;
  hintSide?: -1 | 0 | 1;
  pressedSide?: -1 | 0 | 1;
  disabled?: boolean;
  onPress: (side: -1 | 1) => void;
  onRelease: () => void;
}) {
  return (
    <div className="stack-field relative flex min-h-[22rem] flex-1 items-end justify-center">
      <StackGlasses
        glasses={glasses}
        theta={theta}
        slide={slide}
        toppled={toppled}
        className="h-[20rem] w-44"
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

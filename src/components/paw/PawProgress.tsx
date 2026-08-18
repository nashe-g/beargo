import { PAW_VIEWBOX, TOE_PATHS } from "@/lib/paw-geometry";
import { PawPad } from "@/components/paw/PawShapes";

type PawProgressProps = {
  filledToes?: number;
  padFilled?: boolean;
  className?: string;
};

export function PawProgress({
  filledToes = 0,
  padFilled = false,
  className,
}: PawProgressProps) {
  const toes = Math.max(0, Math.min(4, filledToes));

  return (
    <svg
      viewBox={PAW_VIEWBOX}
      className={className}
      role="img"
      aria-label={`Progress ${toes} of 4 toes${padFilled ? ", pad complete" : ""}`}
    >
      {TOE_PATHS.map((toe, index) => {
        const filled = index < toes;
        return (
          <path
            key={toe.id}
            d={toe.d}
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={filled ? 0 : 4}
          />
        );
      })}
      <PawPad
        fill={padFilled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={padFilled ? 0 : 4}
      />
    </svg>
  );
}

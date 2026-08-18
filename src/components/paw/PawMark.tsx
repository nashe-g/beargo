import { PAW_VIEWBOX } from "@/lib/paw-geometry";
import { PawPad, PawToes } from "@/components/paw/PawShapes";

type PawMarkProps = {
  className?: string;
  title?: string;
};

export function PawMark({ className, title = "BearGo paw" }: PawMarkProps) {
  return (
    <svg
      viewBox={PAW_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <PawToes />
      <PawPad />
    </svg>
  );
}

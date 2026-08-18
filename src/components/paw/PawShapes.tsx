import { PAD_PATH, TOE_PATHS } from "@/lib/paw-geometry";

type ShapeFill = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export function PawToes({
  fill = "currentColor",
  stroke = "none",
  strokeWidth = 0,
}: ShapeFill) {
  return (
    <>
      {TOE_PATHS.map((toe) => (
        <path
          key={toe.id}
          d={toe.d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
    </>
  );
}

export function PawPad({
  fill = "currentColor",
  stroke = "none",
  strokeWidth = 0,
}: ShapeFill) {
  return (
    <path
      d={PAD_PATH}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}

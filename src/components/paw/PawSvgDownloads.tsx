import { PAW_FILL_OPTIONS, type PawFill } from "@/lib/paw-svg";

export function pawSvgHref(
  token: string,
  fill: PawFill,
  usingLocal = false,
) {
  const params = new URLSearchParams({ fill });
  if (usingLocal) params.set("src", "local");
  return `/p/${encodeURIComponent(token)}/paw.svg?${params}`;
}

type PawSvgDownloadsProps = {
  token: string;
  usingLocal?: boolean;
  compact?: boolean;
};

export function PawSvgDownloads({
  token,
  usingLocal = false,
  compact = false,
}: PawSvgDownloadsProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {compact ? (
        <p className="text-xs text-ink-soft">Download SVG</p>
      ) : (
        <p className="text-sm text-ink-soft">Download SVG</p>
      )}
      <div
        className={
          compact
            ? "flex flex-wrap justify-end gap-x-3 gap-y-1"
            : "grid grid-cols-2 gap-2"
        }
      >
        {PAW_FILL_OPTIONS.map((option) => (
          <a
            key={option.id}
            href={pawSvgHref(token, option.id, usingLocal)}
            className={
              compact
                ? "inline-flex items-center gap-1.5 text-ink"
                : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/15 text-ink"
            }
          >
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full border border-ink/20"
              style={{ backgroundColor: option.hex }}
            />
            {option.label}
          </a>
        ))}
      </div>
    </div>
  );
}

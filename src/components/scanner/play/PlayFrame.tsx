import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { BearState } from "@/lib/bear";
import type { ReactNode } from "react";

export function PlayFrame({
  index,
  total,
  bearState,
  progress,
  embedded = false,
  children,
}: {
  index: number;
  total: number;
  bearState: BearState;
  progress: { filledToes: number; padFilled?: boolean };
  embedded?: boolean;
  children: ReactNode;
}) {
  return (
    <ScannerShell progress={progress} embedded={embedded}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-2 sm:gap-5">
        <div className="flex items-center justify-between">
          <p className="text-sm tracking-[0.2em] text-paper/55 uppercase">
            {Math.min(index + 1, total)} / {total}
          </p>
          <BearGuide state={bearState} size="sm" />
        </div>
        {children}
      </div>
    </ScannerShell>
  );
}

export const choiceClass =
  "min-h-14 rounded-2xl border border-paper/15 bg-paper/8 px-4 py-3 text-left text-base transition active:scale-[0.99] active:bg-paper/12 sm:text-lg";

import type { ReactNode } from "react";
import { PawMark } from "@/components/paw/PawMark";
import { PawProgress } from "@/components/paw/PawProgress";

type ScannerShellProps = {
  children: ReactNode;
  showMark?: boolean;
  progress?: {
    filledToes: number;
    padFilled?: boolean;
  };
};

export function ScannerShell({
  children,
  showMark = true,
  progress,
}: ScannerShellProps) {
  return (
    <div className="scanner-stage h-dvh max-h-dvh overflow-hidden text-paper">
      <div className="mx-auto flex h-full w-full max-w-lg flex-col md:max-w-[28rem] md:justify-center md:px-4 md:py-8 lg:max-w-[30rem]">
        <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:h-[min(52rem,calc(100dvh-4rem))] md:flex-none md:rounded-[2rem] md:border md:border-honey/20 md:bg-ink md:px-6 md:shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          {progress ? (
            <div className="flex justify-center pb-1">
              <PawProgress
                className="h-7 w-7 text-honey"
                filledToes={progress.filledToes}
                padFilled={progress.padFilled}
              />
            </div>
          ) : showMark ? (
            <div className="flex justify-center pb-1">
              <PawMark className="h-7 w-7 text-honey" title="BearGo" />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

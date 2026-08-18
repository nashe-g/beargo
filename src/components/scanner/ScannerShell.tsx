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
    <div className="scanner-stage min-h-dvh overflow-x-hidden text-paper">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-[28rem] md:justify-center md:px-4 md:py-8 lg:max-w-[30rem]">
        <div className="flex min-h-dvh flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:h-[min(52rem,calc(100dvh-4rem))] md:min-h-0 md:flex-none md:rounded-[2rem] md:border md:border-honey/20 md:bg-ink md:px-6 md:shadow-[0_28px_80px_rgba(0,0,0,0.5)] md:overflow-hidden">
          {progress ? (
            <div className="flex justify-center pb-2">
              <PawProgress
                className="h-8 w-8 text-honey"
                filledToes={progress.filledToes}
                padFilled={progress.padFilled}
              />
            </div>
          ) : showMark ? (
            <div className="flex justify-center pb-2">
              <PawMark className="h-7 w-7 text-honey" title="BearGo" />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

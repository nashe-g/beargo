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
    <div className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
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
  );
}

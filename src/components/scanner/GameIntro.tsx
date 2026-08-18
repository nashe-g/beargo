import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { PawRecord } from "@/lib/paws";

export function GameIntro({ paw }: { paw: PawRecord }) {
  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="scanned" />
      <div className="flex flex-1 flex-col items-center justify-between py-4 sm:py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BearGuide state="arrive" size="lg" />
          <p className="text-sm tracking-[0.22em] text-honey uppercase">
            Today at {paw.hostDisplayName}
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">
            Today’s BearGo Challenge
          </h1>
          <p className="max-w-[18rem] text-base text-paper/80 sm:text-lg">
            3 questions. Correct answers + speed determine your rank.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <Link
            href={`/p/${paw.token}/play`}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
          >
            PLAY
          </Link>
          <p className="text-sm text-paper/50">No account. About 30 seconds.</p>
        </div>
      </div>
    </ScannerShell>
  );
}

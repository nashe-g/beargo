import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { PawRecord } from "@/lib/paws";
import { PLAY_HOOK, playRoundList } from "@/lib/play-rounds";

export function GameIntro({ paw }: { paw: PawRecord }) {
  const rounds = playRoundList();

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="scanned" />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-y-auto py-4 sm:py-6">
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
          <BearGuide state="arrive" size="md" />
          <p className="text-sm tracking-[0.22em] text-honey uppercase">
            Today at {paw.hostDisplayName}
          </p>
          <p className="font-condensed text-sm tracking-[0.22em] text-honey/80">
            {PLAY_HOOK.kicker}
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">
            {PLAY_HOOK.title}
          </h1>
          <p className="max-w-[20rem] text-base text-paper/80 sm:text-lg">
            {PLAY_HOOK.body}
          </p>
          <ol className="mt-1 w-full max-w-[20rem] space-y-2 text-left">
            {rounds.map((round) => (
              <li
                key={round.id}
                className="flex items-baseline gap-3 rounded-2xl border border-paper/10 bg-paper/6 px-4 py-2.5"
              >
                <span className="font-condensed text-sm tracking-[0.18em] text-honey">
                  {round.n}
                </span>
                <span>
                  <span className="block font-semibold text-paper">
                    {round.name}
                  </span>
                  <span className="block text-sm text-paper/55">
                    {round.tease}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <Link
            href={`/p/${paw.token}/play`}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            {PLAY_HOOK.cta}
          </Link>
          <p className="text-sm text-paper/50">No account. About two minutes.</p>
        </div>
      </div>
    </ScannerShell>
  );
}

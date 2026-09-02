import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { PawRecord } from "@/lib/paws";
import { formatWobble } from "@/lib/stack";

/**
 * The micro-intro. Readable in two seconds; a person watching over a
 * shoulder should understand the game without reading anything at all.
 */
function roomHref(token: string, from?: string | null) {
  return from === "share" ? `/p/${token}/room?from=share` : `/p/${token}/room`;
}

export function GameIntro({
  paw,
  played,
  from,
}: {
  paw: PawRecord;
  played: { rank: number; playerCount: number; stackWobble: number } | null;
  from?: string | null;
}) {
  const demo = paw.token === "demo";

  if (played) {
    return (
      <ScannerShell>
        <StampSession pawToken={paw.token} event="scanned" from={from} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <BearGuide state="arrive" size="md" />
          <p className="mt-3 text-sm tracking-[0.22em] text-honey uppercase">
            Tonight at {paw.hostDisplayName}
          </p>
          <h1 className="mt-4 font-display text-4xl">Played.</h1>
          <p className="mt-3 text-lg text-paper/85">
            #{played.rank} of {played.playerCount} · wobble{" "}
            {formatWobble(played.stackWobble)}
          </p>
          <p className="mt-3 max-w-[19rem] text-base text-paper/60">
            Come back tomorrow — or make your friend try.
          </p>
          <Link
            href={`/p/${paw.token}/result`}
            className="btn-honey mt-8 flex h-14 w-full max-w-[20rem] items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            See tonight’s rank
          </Link>
          <Link
            href={roomHref(paw.token, from)}
            className="mt-3 flex h-12 w-full max-w-[20rem] items-center justify-center text-sm text-paper/60"
          >
            Talk to the room
          </Link>
        </div>
      </ScannerShell>
    );
  }

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="scanned" from={from} />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center">
          <BearGuide state="arrive" size="md" />
          <p className="mt-3 text-sm tracking-[0.22em] text-honey uppercase">
            {demo ? "Demo" : "Tonight"} at {paw.hostDisplayName}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Don’t drop the drinks.
          </h1>
          <p className="mt-4 max-w-[19rem] text-lg text-paper/85">
            Tap the side they’re falling toward.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col items-center gap-3 pt-3">
          <Link
            href={`/p/${paw.token}/stack`}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            Start
          </Link>
          <Link
            href={roomHref(paw.token, from)}
            className="flex h-12 w-full items-center justify-center text-sm text-paper/60"
          >
            Talk to the room
          </Link>
          <p className="text-sm text-paper/50">
            One run a night. Rank is this room, tonight.
          </p>
        </div>
      </div>
    </ScannerShell>
  );
}

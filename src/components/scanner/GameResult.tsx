"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import { loadAttempt } from "@/lib/attempt";
import type { PawRecord } from "@/lib/paws";
import { formatWobble } from "@/lib/stack";

export type ServedResult = {
  stackWobble: number;
  rank: number;
  playerCount: number;
  playersBeaten: number;
  topWobbles: number[];
};

type Result = ServedResult & { hasAttempt: boolean };

function verdict(rank: number, playerCount: number) {
  if (playerCount <= 1) return null;
  if (rank === 1 && playerCount >= 4) return "You’re running the bar.";
  if (rank / playerCount <= 1 / 3) return "Steady hands.";
  if (rank / playerCount >= 0.75) return "Rough shift.";
  return null;
}

export function GameResult({
  paw,
  served,
}: {
  paw: PawRecord;
  served: ServedResult | null;
}) {
  const [result, setResult] = useState<Result | null>(
    served ? { ...served, hasAttempt: true } : null,
  );
  const [checked, setChecked] = useState(false);
  const host = paw.hostDisplayName;

  useEffect(() => {
    // Prefer the fresh sessionStorage attempt (it has the just-posted
    // rank); fall back to the server-side device lookup.
    const attempt = loadAttempt(paw.token);
    if (attempt?.stackWobble != null) {
      setResult({
        stackWobble: attempt.stackWobble,
        rank: attempt.rank ?? 0,
        playerCount: attempt.playerCount ?? 0,
        playersBeaten: attempt.playersBeaten ?? 0,
        topWobbles: attempt.topWobbles ?? served?.topWobbles ?? [],
        hasAttempt: true,
      });
    }
    setChecked(true);
  }, [paw.token, served]);

  if (!checked && !result) {
    return (
      <ScannerShell>
        <div className="flex-1" />
      </ScannerShell>
    );
  }

  if (!result) {
    return (
      <ScannerShell>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <BearGuide state="arrive" size="md" />
          <h1 className="mt-6 font-display text-3xl leading-tight">
            Play to see where you stand at {host} tonight.
          </h1>
          <Link
            href={`/p/${paw.token}/stack`}
            className="btn-honey mt-8 flex h-14 w-full max-w-[20rem] items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
          >
            Play
          </Link>
        </div>
      </ScannerShell>
    );
  }

  const first = result.playerCount <= 1;
  const ranked = result.rank > 0 && result.playerCount > 1;
  const line = verdict(result.rank, result.playerCount);
  const board = ranked && result.topWobbles.length > 0;

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_completed" />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-1 text-center">
          <BearGuide state="celebrate" size="sm" />
          {line ? (
            <p className="mt-2 text-sm tracking-[0.22em] text-honey uppercase">
              {line}
            </p>
          ) : null}
          {first ? (
            <>
              <h1 className="mt-2 font-display text-4xl leading-tight">
                You set the score.
              </h1>
              <p className="mt-2 text-base text-paper/70">
                First run of the night at {host}.
              </p>
            </>
          ) : ranked ? (
            <>
              <h1 className="mt-1 font-display text-6xl leading-none">
                #{result.rank}
                <span className="text-3xl text-paper/60"> of {result.playerCount}</span>
              </h1>
              <p className="mt-2 text-sm tracking-[0.2em] text-paper/60 uppercase">
                At {host} tonight
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-display text-4xl leading-tight">
                On the board.
              </h1>
              <p className="mt-2 text-base text-paper/60">
                Rank didn’t load. The run is saved.
              </p>
            </>
          )}
          <p className="mt-3 font-condensed text-lg tracking-[0.18em] text-paper/85">
            WOBBLE {formatWobble(result.stackWobble)}
          </p>

          {board ? (
            <ul className="mt-4 w-full max-w-[16rem] space-y-1.5 text-left">
              {result.topWobbles.map((tenths, index) => {
                const mine =
                  result.rank === index + 1 && tenths === result.stackWobble;
                return (
                  <li
                    key={`${index}-${tenths}`}
                    className={`flex justify-between rounded-xl px-4 py-2 text-sm ${
                      mine
                        ? "bg-honey/15 text-honey"
                        : "bg-paper/6 text-paper/70"
                    }`}
                  >
                    <span>{mine ? `${index + 1} · You` : index + 1}</span>
                    <span>{formatWobble(tenths)}</span>
                  </li>
                );
              })}
              {result.rank > result.topWobbles.length ? (
                <li className="flex justify-between rounded-xl bg-honey/15 px-4 py-2 text-sm text-honey">
                  <span>{result.rank} · You</span>
                  <span>{formatWobble(result.stackWobble)}</span>
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="mt-5">
            <p className="font-display text-2xl leading-tight">
              {first
                ? "Now make somebody beat it."
                : "Think your table can beat that?"}
            </p>
            <p className="mt-1.5 text-base text-paper/60">
              Make them scan the paw.
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-3 text-center">
          <Link
            href={`/p/${paw.token}/sponsor`}
            className="text-sm text-paper/50 underline decoration-honey/60 underline-offset-4"
          >
            Tonight’s sponsor
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

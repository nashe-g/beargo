"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import { formatDuration, loadAttempt } from "@/lib/attempt";
import { answersReady, attemptNeedsBoardName } from "@/lib/play-rounds";
import type { PawRecord } from "@/lib/paws";
import { TRIVIA_ENABLED } from "@/lib/config";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import type { BoardNeighbor } from "@/lib/rank";
import { formatWobble } from "@/lib/stack";

export type ServedResult = {
  stackWobble: number;
  correctCount: number;
  totalResponseMs: number;
  boardName?: string | null;
  rank: number;
  playerCount: number;
  playersBeaten: number;
  topWobbles: number[];
  neighbors?: BoardNeighbor[];
};

type Result = ServedResult & { hasAttempt: boolean; hasAnswers: boolean };

function scoreLine(correct: number, ms: number, wobble: number) {
  const trivia = TRIVIA_ENABLED
    ? `${correct} / ${QUESTIONS_PER_CHALLENGE} · ${formatDuration(ms)} · `
    : "";
  return `${trivia}WOBBLE ${formatWobble(wobble)}`;
}

export function GameResult({
  paw,
  served,
}: {
  paw: PawRecord;
  served: ServedResult | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(
    served ? { ...served, hasAttempt: true, hasAnswers: false } : null,
  );
  const [checked, setChecked] = useState(false);
  const host = paw.hostDisplayName;

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (attemptNeedsBoardName(attempt) && !served) {
      router.replace(`/p/${paw.token}/name`);
      return;
    }
    if (attempt?.stackWobble != null && answersReady(attempt)) {
      setResult({
        stackWobble: attempt.stackWobble,
        correctCount: attempt.correctCount,
        totalResponseMs: attempt.totalResponseMs,
        boardName: attempt.boardName,
        rank: attempt.rank ?? served?.rank ?? 0,
        playerCount: attempt.playerCount ?? served?.playerCount ?? 0,
        playersBeaten: attempt.playersBeaten ?? served?.playersBeaten ?? 0,
        topWobbles: attempt.topWobbles ?? served?.topWobbles ?? [],
        neighbors: attempt.neighbors ?? served?.neighbors ?? [],
        hasAttempt: true,
        hasAnswers: (attempt.answers?.length ?? 0) > 0,
      });
    } else if (served) {
      setResult((current) =>
        current
          ? {
              ...current,
              hasAnswers: (attempt?.answers?.length ?? 0) > 0,
            }
          : current,
      );
    }
    setChecked(true);
  }, [paw.token, router, served]);

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
  const ranked = result.rank > 0 && result.playerCount > 0;
  const neighbors = result.neighbors ?? [];

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_completed" />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center">
          <BearGuide state="celebrate" size="sm" />
          <p className="mt-2 text-sm tracking-[0.22em] text-honey uppercase">
            Your Rank
          </p>
          {ranked ? (
            <h1 className="mt-2 font-display text-6xl leading-none">
              #{result.rank}
              <span className="text-3xl text-paper/60">
                {" "}
                of {result.playerCount}
              </span>
            </h1>
          ) : (
            <h1 className="mt-2 font-display text-4xl leading-tight">
              On the board.
            </h1>
          )}
          <p className="mt-2 text-sm tracking-[0.2em] text-paper/60 uppercase">
            {first ? `First at ${host}` : `At ${host} tonight`}
          </p>
          <p className="mt-3 font-condensed text-lg tracking-[0.12em] text-paper/85">
            {scoreLine(
              result.correctCount,
              result.totalResponseMs,
              result.stackWobble,
            )}
          </p>

          {neighbors.length > 0 ? (
            <ul className="mt-5 w-full max-w-[20rem] space-y-1.5 text-left">
              {neighbors.map((row) => (
                <li
                  key={`${row.rank}-${row.name}`}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                    row.mine
                      ? "bg-honey/15 text-honey"
                      : "bg-paper/6 text-paper/75"
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {row.rank} · {row.mine ? row.name || "You" : row.name}
                  </span>
                  <span className="shrink-0 pl-3 font-condensed tracking-[0.08em]">
                    {TRIVIA_ENABLED
                      ? `${row.correctCount}/${QUESTIONS_PER_CHALLENGE} · ${formatWobble(row.stackWobble)}`
                      : formatWobble(row.stackWobble)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 pt-4 text-center">
          <Link
            href={`/p/${paw.token}/sponsor`}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            Tonight’s sponsor
          </Link>
          {TRIVIA_ENABLED && result.hasAnswers ? (
            <Link
              href={`/p/${paw.token}/play?review=1`}
              className="flex h-12 w-full items-center justify-center text-sm text-paper/60 underline-offset-4 hover:text-paper hover:underline"
            >
              See tonight’s questions
            </Link>
          ) : null}
        </div>
      </div>
    </ScannerShell>
  );
}

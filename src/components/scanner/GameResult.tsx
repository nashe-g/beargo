"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import {
  attemptNeedsSkill,
  beatCopy,
  formatDuration,
  loadAttempt,
} from "@/lib/attempt";
import { nextPlayPath } from "@/lib/play-rounds";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import type { PawRecord } from "@/lib/paws";

function ScoreRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <li className="rounded-2xl border border-paper/10 bg-paper/6 px-4 py-2.5 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tracking-[0.16em] text-paper/50 uppercase">
          {label}
        </span>
        <span className="font-semibold text-paper">{value}</span>
      </div>
      <p className="mt-0.5 text-sm text-paper/50">{hint}</p>
    </li>
  );
}

export function GameResult({ paw }: { paw: PawRecord }) {
  const router = useRouter();
  const [score, setScore] = useState({
    correctCount: 0,
    totalResponseMs: 0,
    pourMg: null as number | null,
    stackWobble: null as number | null,
    rank: 0,
    playerCount: 0,
    playersBeaten: 0,
    hasAttempt: false,
  });
  const host = paw.hostDisplayName;

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (attemptNeedsSkill(attempt)) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    if (attempt) {
      setScore({
        correctCount: attempt.correctCount,
        totalResponseMs: attempt.totalResponseMs,
        pourMg: attempt.pourMg ?? null,
        stackWobble: attempt.stackWobble ?? null,
        rank: attempt.rank ?? 0,
        playerCount: attempt.playerCount ?? 0,
        playersBeaten: attempt.playersBeaten ?? 0,
        hasAttempt: true,
      });
    }
  }, [paw.token, router]);

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_completed" />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-1 text-center">
          <BearGuide state="celebrate" size="sm" />
          {score.hasAttempt ? (
            <>
              <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                {score.rank > 0
                  ? `#${score.rank} at ${host} today`
                  : `On the board at ${host}`}
              </h1>
              <p className="mt-1 text-base text-paper/70">
                {score.rank > 0
                  ? beatCopy(score.playersBeaten, score.playerCount)
                  : "Rank will show on the next play."}
              </p>
              <ul className="mt-4 w-full max-w-xs space-y-2">
                <ScoreRow
                  label="Trivia"
                  value={`${score.correctCount} of ${QUESTIONS_PER_CHALLENGE}`}
                  hint={`${formatDuration(score.totalResponseMs)} on the questions`}
                />
                {score.pourMg != null ? (
                  <ScoreRow
                    label="Pour"
                    value={`${score.pourMg.toLocaleString()} mg off`}
                    hint="Closer to the line is better."
                  />
                ) : null}
                {score.stackWobble != null ? (
                  <ScoreRow
                    label="Tray"
                    value={score.stackWobble.toLocaleString()}
                    hint="Lower is steadier."
                  />
                ) : null}
              </ul>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-3xl leading-tight">
                Play to see where you stand at {host} today.
              </h1>
              <Link
                href={`/p/${paw.token}/play`}
                className="btn-honey mt-8 flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
              >
                PLAY
              </Link>
            </>
          )}
        </div>

        {score.hasAttempt ? (
          <div className="shrink-0 pt-3">
            <Link
              href={`/p/${paw.token}/sponsor`}
              className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
            >
              See tonight’s sponsor
            </Link>
          </div>
        ) : null}
      </div>
    </ScannerShell>
  );
}

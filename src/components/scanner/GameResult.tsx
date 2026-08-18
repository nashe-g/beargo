"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { beatCopy, formatDuration, loadAttempt } from "@/lib/attempt";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import { StampSession } from "@/components/scanner/StampSession";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import type { PawRecord } from "@/lib/paws";

type Phase = "celebrate" | "handoff" | "expanded" | "done";

export function GameResult({
  paw,
  hasSponsor,
  questionIds = [],
}: {
  paw: PawRecord;
  hasSponsor: boolean;
  questionIds?: string[];
}) {
  const [phase, setPhase] = useState<Phase>("celebrate");
  const [bearState, setBearState] = useState<BearState>("celebrate");
  const [score, setScore] = useState({
    correctCount: 0,
    totalResponseMs: 0,
    rank: 0,
    playerCount: 0,
    playersBeaten: 0,
    hasAttempt: false,
  });
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (attempt) {
      setScore({
        correctCount: attempt.correctCount,
        totalResponseMs: attempt.totalResponseMs,
        rank: attempt.rank ?? 0,
        playerCount: attempt.playerCount ?? 0,
        playersBeaten: attempt.playersBeaten ?? 0,
        hasAttempt: true,
      });
    }

    const look = window.setTimeout(() => {
      if (hasSponsor) {
        setPhase("handoff");
        setBearState("lookDown");
        return;
      }
      setPhase("done");
      setBearState("thanks");
    }, BEAR_DURATIONS.celebrate);

    return () => window.clearTimeout(look);
  }, [paw.token, hasSponsor]);

  function expand() {
    setPhase("expanded");
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    startY.current = event.clientY;
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (startY.current != null && startY.current - event.clientY > 42) {
      expand();
    }
    startY.current = null;
  }

  const host = paw.hostDisplayName;

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_completed" />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center pt-4 text-center">
          <BearGuide state={bearState} size="md" />
          {score.hasAttempt ? (
            <>
              <p className="mt-4 font-display text-6xl">
                {score.correctCount} / {QUESTIONS_PER_CHALLENGE}
              </p>
              <p className="mt-1 text-xl text-paper/70">
                {formatDuration(score.totalResponseMs)}
              </p>
              <h1 className="mt-6 font-display text-3xl leading-tight">
                {score.rank > 0
                  ? `#${score.rank} at ${host} today`
                  : `On the board at ${host}`}
              </h1>
              <p className="mt-2 text-paper/65">
                {score.rank > 0
                  ? beatCopy(score.playersBeaten, score.playerCount)
                  : "Rank will show on the next play."}
              </p>
              {!hasSponsor && phase === "done" ? (
                <p className="mt-8 text-paper/65">Thanks for playing.</p>
              ) : null}
              {score.hasAttempt ? (
                <ReportQuestion pawToken={paw.token} questionIds={questionIds} />
              ) : null}
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-3xl leading-tight">
                Play to see how you rank at {host} today.
              </h1>
              <Link
                href={`/p/${paw.token}/play`}
                className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
              >
                PLAY
              </Link>
            </>
          )}
        </div>

        {score.hasAttempt && hasSponsor && phase !== "expanded" ? (
          <button
            type="button"
            onClick={expand}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            className={`teaser-card ${phase === "handoff" ? "teaser-card-pulse" : ""}`}
          >
            <span className="block text-center text-lg tracking-[0.04em]">
              ↑
            </span>
            <span className="mt-2 block font-condensed text-2xl leading-none tracking-[0.06em]">
              YOU CAN MAKE A COMPANY PAY {host.toUpperCase()}.
            </span>
            <span className="mt-2 block text-sm text-ink-soft">
              You pay nothing.
            </span>
          </button>
        ) : null}

        {score.hasAttempt && hasSponsor && phase === "expanded" ? (
          <div className="absolute inset-x-0 bottom-0 top-24 flex flex-col justify-end">
            <div className="rounded-t-[2rem] bg-paper px-5 pb-8 pt-8 text-ink">
              <p className="font-display text-3xl leading-tight">
                You can make a company pay {host}.
              </p>
              <p className="mt-3 text-lg text-ink-soft">You pay nothing.</p>
              <Link
                href={`/p/${paw.token}/company`}
                className="mt-8 flex h-14 items-center justify-center rounded-full bg-ink text-lg font-semibold tracking-[0.18em] text-paper"
              >
                SHOW ME
              </Link>
              <p className="mt-4 text-center text-sm text-ink-soft">
                Optional. The game is already done.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </ScannerShell>
  );
}

function ReportQuestion({
  pawToken,
  questionIds,
}: {
  pawToken: string;
  questionIds: string[];
}) {
  const [sent, setSent] = useState(false);
  if (questionIds.length === 0) return null;
  return (
    <button
      type="button"
      className="mt-6 text-sm text-paper/45 underline-offset-2 hover:underline"
      onClick={() => {
        if (sent) return;
        fetch(`/api/p/${pawToken}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: questionIds[0] }),
        }).catch(() => undefined);
        setSent(true);
      }}
    >
      {sent ? "Reported. Thanks." : "Report this question"}
    </button>
  );
}

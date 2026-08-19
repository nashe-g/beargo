"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { PointingFinger } from "@/components/scanner/PointingFinger";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import { beatCopy, formatDuration, loadAttempt } from "@/lib/attempt";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import type { OfferCard } from "@/lib/select-promotion";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import type { PawRecord } from "@/lib/paws";

type Phase = "celebrate" | "handoff" | "expanded" | "done";

export function GameResult({
  paw,
  offer,
  claimedHref,
  questionIds = [],
}: {
  paw: PawRecord;
  offer: OfferCard | null;
  claimedHref?: string | null;
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
  const host = paw.hostDisplayName;
  const hasOffer = Boolean(offer) || Boolean(claimedHref);

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
      if (hasOffer) {
        setPhase("handoff");
        setBearState("lookDown");
        return;
      }
      setPhase("done");
      setBearState("thanks");
    }, BEAR_DURATIONS.celebrate);

    return () => window.clearTimeout(look);
  }, [paw.token, hasOffer]);

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

  const nearbyLine = offer
    ? [offer.distanceLabel, offer.urgency].filter(Boolean).join(" · ")
    : "";
  const unlocked =
    offer?.teaserMode === "merchant_visible"
      ? `${offer.valueHeadline} AT ${offer.merchantName.toUpperCase()}`
      : `${offer?.valueHeadline} NEARBY`;

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="game_completed"
        promotionId={offer?.promotionId}
      />
      {offer ? (
        <StampSession
          pawToken={paw.token}
          event="teaser_shown"
          promotionId={offer.promotionId}
        />
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-2 text-center">
          <BearGuide state={bearState} size="sm" />
          {score.hasAttempt ? (
            <>
              <p className="mt-2 font-display text-4xl sm:text-5xl">
                {score.correctCount} / {QUESTIONS_PER_CHALLENGE}
              </p>
              <p className="mt-1 text-base text-paper/70 sm:text-lg">
                {formatDuration(score.totalResponseMs)}
              </p>
              <h1 className="mt-3 font-display text-xl leading-tight sm:text-2xl">
                {score.rank > 0
                  ? `#${score.rank} at ${host} today`
                  : `On the board at ${host}`}
              </h1>
              <p className="mt-1 text-sm text-paper/65 sm:text-base">
                {score.rank > 0
                  ? beatCopy(score.playersBeaten, score.playerCount)
                  : "Rank will show on the next play."}
              </p>
              {!hasOffer && phase === "done" ? (
                <p className="mt-6 text-paper/65">Thanks for playing.</p>
              ) : null}
              <ReportQuestion pawToken={paw.token} questionIds={questionIds} />
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-3xl leading-tight">
                Play to see how you rank at {host} today.
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

        {score.hasAttempt && claimedHref && phase !== "expanded" ? (
          <div className="mt-auto shrink-0">
            <Link href={claimedHref} className="teaser-card block">
              <span className="block text-xs font-semibold tracking-[0.22em] text-honey-deep">
                YOUR VOUCHER
              </span>
              <span className="mt-2 block font-condensed text-2xl leading-none">
                SHOW THIS WHEN YOU PAY
              </span>
            </Link>
          </div>
        ) : null}

        {score.hasAttempt && offer && !claimedHref && phase !== "expanded" ? (
          <div className="mt-auto shrink-0">
            <div className="flex justify-center">
              <PointingFinger className="pointing-finger" />
            </div>
            <button
              type="button"
              onClick={expand}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              className={`teaser-card ${phase !== "celebrate" ? "teaser-card-pulse" : ""}`}
            >
              <span className="block text-xs font-semibold tracking-[0.22em] text-honey-deep">
                YOU UNLOCKED
              </span>
              <span className="mt-2 block font-condensed text-3xl leading-none tracking-[0.04em]">
                {unlocked}
              </span>
              <span className="mt-3 block text-sm uppercase tracking-[0.12em] text-ink-soft">
                {nearbyLine}
              </span>
              <span className="mt-4 block font-semibold tracking-[0.18em]">
                {offer.teaserCta}
              </span>
            </button>
          </div>
        ) : null}

        {score.hasAttempt && offer && !claimedHref && phase === "expanded" ? (
          <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col justify-end">
            <StampSession
              pawToken={paw.token}
              event="teaser_opened"
              promotionId={offer.promotionId}
            />
            <div className="rounded-t-[2rem] bg-paper px-5 pb-8 pt-8 text-ink shadow-[0_-18px_50px_rgba(0,0,0,0.28)]">
              <p className="text-xs font-semibold tracking-[0.22em] text-honey-deep">
                YOU UNLOCKED
              </p>
              <p className="mt-2 font-display text-4xl leading-tight">
                {offer.teaserMode === "merchant_visible"
                  ? `${offer.valueHeadline} at ${offer.merchantName}`
                  : `${offer.valueHeadline} nearby`}
              </p>
              <p className="mt-3 text-lg text-ink-soft">{nearbyLine}</p>
              <Link
                href={`/p/${paw.token}/offer`}
                className="btn-honey mt-8 flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
              >
                {offer.teaserCta}
              </Link>
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
      className="mt-3 text-xs text-paper/45 underline-offset-2 hover:underline"
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

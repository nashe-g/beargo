"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { PointingFinger } from "@/components/scanner/PointingFinger";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import {
  attemptNeedsSkill,
  beatCopy,
  formatDuration,
  loadAttempt,
  skillHref,
} from "@/lib/attempt";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import { AffiliateCard } from "@/components/scanner/AffiliateCard";
import type { AffiliateCardView } from "@/lib/affiliate";
import type { OfferCard } from "@/lib/select-promotion";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import type { PawRecord } from "@/lib/paws";

export function GameResult({
  paw,
  offer,
  claimedHref,
  affiliate,
}: {
  paw: PawRecord;
  offer: OfferCard | null;
  claimedHref?: string | null;
  affiliate?: AffiliateCardView | null;
}) {
  const router = useRouter();
  const [showOffer, setShowOffer] = useState(false);
  const [bearState, setBearState] = useState<BearState>("celebrate");
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
  const hasOffer = Boolean(offer) || Boolean(claimedHref);

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (attemptNeedsSkill(attempt)) {
      router.replace(skillHref(paw.token));
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

    const look = window.setTimeout(() => {
      if (hasOffer) {
        setShowOffer(true);
        setBearState("lookDown");
        return;
      }
      setBearState("thanks");
    }, BEAR_DURATIONS.celebrate);

    return () => window.clearTimeout(look);
  }, [paw.token, hasOffer, router]);

  const nearbyLine = offer
    ? [offer.distanceLabel, offer.urgency].filter(Boolean).join(" · ")
    : "";

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
                {score.pourMg != null ? ` · ${score.pourMg} mg off the pour` : ""}
                {score.stackWobble != null
                  ? ` · ${score.stackWobble} wobble`
                  : ""}
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
              {!hasOffer && bearState === "thanks" ? (
                <p className="mt-6 text-paper/65">Thanks for playing.</p>
              ) : null}
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

        {score.hasAttempt && claimedHref && showOffer ? (
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

        {score.hasAttempt && offer && !claimedHref && showOffer ? (
          <div className="mt-auto shrink-0">
            <div className="flex justify-center">
              <PointingFinger className="pointing-finger" />
            </div>
            <div className="teaser-card teaser-card-pulse">
              <p className="text-xs font-semibold tracking-[0.22em] text-honey-deep">
                YOU UNLOCKED
              </p>
              <p className="mt-2 font-display text-3xl leading-tight">
                {offer.offerTitle}
              </p>
              {offer.teaserMode === "merchant_visible" ? (
                <p className="mt-2 text-lg">{offer.merchantName}</p>
              ) : null}
              <p className="mt-2 text-sm text-ink-soft">{nearbyLine}</p>
              <Link
                href={`/p/${paw.token}/offer`}
                className="btn-honey mt-6 flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
              >
                VIEW OFFER
              </Link>
            </div>
          </div>
        ) : null}

        {score.hasAttempt && affiliate ? <AffiliateCard card={affiliate} /> : null}
      </div>
    </ScannerShell>
  );
}

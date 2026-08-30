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
} from "@/lib/attempt";
import { nextPlayPath } from "@/lib/play-rounds";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import { AffiliateCard } from "@/components/scanner/AffiliateCard";
import type { AffiliateCardView } from "@/lib/affiliate";
import type { OfferCard } from "@/lib/select-promotion";
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
    <li className="rounded-2xl border border-paper/10 bg-paper/6 px-4 py-3 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tracking-[0.16em] text-paper/50 uppercase">
          {label}
        </span>
        <span className="font-semibold text-paper">{value}</span>
      </div>
      <p className="mt-1 text-sm text-paper/50">{hint}</p>
    </li>
  );
}

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
  const showPromo =
    score.hasAttempt &&
    showOffer &&
    (Boolean(claimedHref) || Boolean(offer && !claimedHref));

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
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-2 text-center">
          <BearGuide state={bearState} size="sm" />
          {score.hasAttempt ? (
            <>
              <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                {score.rank > 0
                  ? `#${score.rank} at ${host} today`
                  : `On the board at ${host}`}
              </h1>
              <p className="mt-2 text-base text-paper/70 sm:text-lg">
                {score.rank > 0
                  ? beatCopy(score.playersBeaten, score.playerCount)
                  : "Rank will show on the next play."}
              </p>
              <ul className="mt-6 w-full max-w-xs space-y-2">
                <ScoreRow
                  label="Trivia"
                  value={`${score.correctCount} of ${QUESTIONS_PER_CHALLENGE}`}
                  hint={`${formatDuration(score.totalResponseMs)} on the questions`}
                />
                {score.pourMg != null ? (
                  <ScoreRow
                    label="Pour"
                    value={`${score.pourMg.toLocaleString()} mg off`}
                    hint="How far you missed the line. Closer is better."
                  />
                ) : null}
                {score.stackWobble != null ? (
                  <ScoreRow
                    label="Tray"
                    value={score.stackWobble.toLocaleString()}
                    hint="How much the glasses leaned. Lower is steadier."
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

        <div className="mt-4 min-h-[10.5rem] shrink-0">
          {score.hasAttempt && claimedHref && showOffer ? (
            <Link href={claimedHref} className="teaser-card block">
              <span className="block text-xs font-semibold tracking-[0.22em] text-honey-deep">
                YOUR VOUCHER
              </span>
              <span className="mt-2 block font-condensed text-2xl leading-none">
                SHOW THIS WHEN YOU PAY
              </span>
            </Link>
          ) : null}

          {score.hasAttempt && offer && !claimedHref && showOffer ? (
            <div>
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

          {score.hasAttempt && affiliate ? (
            <AffiliateCard card={affiliate} />
          ) : null}

          {score.hasAttempt && !showPromo && !affiliate && bearState === "thanks" ? (
            <p className="pt-2 text-center text-paper/65">Thanks for playing.</p>
          ) : null}
        </div>
      </div>
    </ScannerShell>
  );
}

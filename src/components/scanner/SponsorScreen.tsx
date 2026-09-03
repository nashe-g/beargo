"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { AffiliateCard } from "@/components/scanner/AffiliateCard";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { ShareRank } from "@/components/scanner/ShareRank";
import type { AffiliateCardView } from "@/lib/affiliate";
import { loadAttempt } from "@/lib/attempt";
import type { PawRecord } from "@/lib/paws";
import { resultPath, hubPath, type PlayKind } from "@/lib/play-kind";
import type { ShareCardStats } from "@/lib/share-card";

export function SponsorScreen({
  paw,
  kind,
  affiliate,
}: {
  paw: PawRecord;
  kind: PlayKind;
  affiliate: AffiliateCardView | null;
}) {
  const [stats, setStats] = useState<ShareCardStats | null>(null);

  useEffect(() => {
    const attempt = loadAttempt(paw.token, kind);
    if (kind === "stack" && attempt?.stackWobble == null) return;
    if (kind === "trivia" && attempt?.answers == null && attempt?.rank == null) {
      return;
    }
    if (!attempt) return;
    setStats({
      kind,
      rank: attempt.rank ?? 0,
      playerCount: attempt.playerCount ?? 0,
      correctCount: attempt.correctCount,
      stackWobble: attempt.stackWobble ?? 0,
      boardName: attempt.boardName ?? null,
      dropped: attempt.stackLost ?? null,
      packed: attempt.stackPacked ?? null,
      totalResponseMs: attempt.totalResponseMs,
    });
  }, [kind, paw.token]);

  return (
    <ScannerShell homeHref={hubPath(paw.token)}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-2 text-center">
          <BearGuide state="thanks" size="sm" />
          {affiliate ? (
            <div className="mt-4 w-full">
              <AffiliateCard card={affiliate} />
            </div>
          ) : (
            <>
              <p className="mt-3 font-condensed text-sm tracking-[0.22em] text-honey">
                TONIGHT
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight">
                No sponsor tonight.
              </h1>
              <p className="mt-3 max-w-[20rem] text-base text-paper/70">
                Thanks for playing. Dare the person next to you to beat your
                rank.
              </p>
            </>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 pt-4">
          {stats ? <ShareRank paw={paw} stats={stats} /> : null}
          <Link
            href={hubPath(paw.token)}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            Tonight
          </Link>
          <Link
            href={resultPath(paw.token, kind)}
            className="flex h-12 w-full items-center justify-center text-sm text-paper/60"
          >
            Back to your rank
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

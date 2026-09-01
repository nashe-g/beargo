"use client";

import { useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { AffiliateCard } from "@/components/scanner/AffiliateCard";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { AffiliateCardView } from "@/lib/affiliate";
import { pawScanUrl } from "@/lib/config";
import type { PawRecord } from "@/lib/paws";

export function SponsorScreen({
  paw,
  affiliate,
}: {
  paw: PawRecord;
  affiliate: AffiliateCardView | null;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window === "undefined"
      ? pawScanUrl(paw.token)
      : `${window.location.origin}/p/${encodeURIComponent(paw.token)}`;

  async function share() {
    const text = `Who’s still got it at ${paw.hostDisplayName}?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BearGo", text, url: shareUrl });
        return;
      }
    } catch {
      // Fall through to copy.
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <ScannerShell>
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
          {affiliate ? null : (
            <button
              type="button"
              onClick={() => void share()}
              className="flex h-14 w-full items-center justify-center rounded-full border border-paper/20 text-lg font-semibold"
            >
              {copied ? "Link copied" : "Share BearGo"}
            </button>
          )}
          <Link
            href={`/p/${paw.token}/result`}
            className="flex h-14 w-full items-center justify-center rounded-full border border-paper/20 text-lg font-semibold text-paper"
          >
            Back to your rank
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

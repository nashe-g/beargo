"use client";

import { useRouter } from "next/navigation";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import {
  INTEREST_OPTIONS,
  type Campaign,
  type InterestId,
} from "@/lib/campaigns";
import { saveLeadSession } from "@/lib/lead-session";
import type { PawRecord } from "@/lib/paws";

export function SponsorCard({
  paw,
  campaign,
}: {
  paw: PawRecord;
  campaign: Campaign;
}) {
  const router = useRouter();

  function choose(id: InterestId, kind: "eligible" | "exit") {
    if (kind === "eligible") {
      saveLeadSession(paw.token, {
        campaignId: campaign.id,
        interestId: id,
      });
      router.push(`/p/${paw.token}/intro?from=${id}`);
      return;
    }
    router.push(`/p/${paw.token}/thanks?reason=${id}`);
  }

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="sponsor_viewed"
        campaignId={campaign.id}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-xs tracking-[0.22em] text-honey uppercase">
          {campaign.headline}
        </p>
        <div className="mt-3 rounded-3xl bg-paper px-4 py-4 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
          <h1 className="font-display text-2xl leading-tight sm:text-3xl">
            {campaign.name}
          </h1>
          <p className="mt-2 text-base leading-snug text-ink-soft">
            {campaign.valueProposition}
          </p>
        </div>
        <h2 className="mt-4 font-display text-xl">How does that sound?</h2>
        <div className="mt-3 flex min-h-0 flex-1 flex-col justify-end gap-2 pb-1">
          {INTEREST_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id, option.kind)}
              className="flex min-h-11 shrink-0 items-center rounded-2xl border border-paper/15 bg-paper/8 px-4 text-left text-base transition active:scale-[0.99]"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </ScannerShell>
  );
}

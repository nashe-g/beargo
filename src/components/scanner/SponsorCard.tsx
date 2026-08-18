"use client";

import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
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
      <div className="flex flex-1 flex-col gap-6 py-2">
        <BearGuide state="idle" size="sm" />
        <p className="text-sm tracking-[0.22em] text-honey uppercase">
          {campaign.headline}
        </p>
        <div className="rounded-3xl bg-paper px-5 py-6 text-ink">
          <h1 className="font-display text-4xl">{campaign.name}</h1>
          <p className="mt-3 text-lg text-ink-soft">
            {campaign.valueProposition}
          </p>
        </div>
        <h2 className="font-display text-2xl">How does that sound?</h2>
        <div className="flex flex-col gap-3">
          {INTEREST_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id, option.kind)}
              className="min-h-14 rounded-2xl border border-paper/15 bg-paper/5 px-4 text-left text-lg"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </ScannerShell>
  );
}

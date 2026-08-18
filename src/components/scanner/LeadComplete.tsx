import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { Campaign } from "@/lib/campaigns";
import type { PawRecord } from "@/lib/paws";

export function LeadComplete({
  paw,
  campaign,
}: {
  paw: PawRecord;
  campaign: Campaign;
}) {
  return (
    <ScannerShell progress={{ filledToes: 4, padFilled: true }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
        <BearGuide state="completeHappy" size="lg" />
        <h1 className="font-display text-4xl">You did it.</h1>
        <p className="text-xl text-paper/80">
          {campaign.name} can pay {paw.hostDisplayName} for your introduction.
        </p>
        <p className="text-honey">You paid $0.</p>
      </div>
    </ScannerShell>
  );
}

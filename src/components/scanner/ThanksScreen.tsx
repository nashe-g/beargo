import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { thanksCopy } from "@/lib/campaigns";

export function ThanksScreen({ reason }: { reason?: string }) {
  return (
    <ScannerShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <BearGuide state="thanks" size="lg" />
        <h1 className="font-display text-3xl leading-tight">
          {thanksCopy(reason)}
        </h1>
      </div>
    </ScannerShell>
  );
}

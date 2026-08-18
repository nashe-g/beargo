import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";

export function AlreadyConnected({ sponsorName }: { sponsorName: string }) {
  return (
    <ScannerShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <BearGuide state="thanks" size="lg" />
        <h1 className="font-display text-3xl leading-tight">
          Looks like you’ve already connected with {sponsorName}.
        </h1>
        <p className="text-lg text-paper/70">No need to do it again.</p>
      </div>
    </ScannerShell>
  );
}

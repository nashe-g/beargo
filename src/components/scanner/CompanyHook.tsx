import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { PawRecord } from "@/lib/paws";

export function CompanyHook({ paw }: { paw: PawRecord }) {
  const host = paw.hostDisplayName;

  return (
    <ScannerShell>
      <div className="flex flex-1 flex-col justify-between py-4">
        <div className="space-y-6">
          <BearGuide state="idle" size="sm" />
          <h1 className="font-display text-3xl leading-tight">
            Here’s how it works
          </h1>
          <div className="space-y-4 text-lg text-paper/80">
            <p>
              Companies want to meet people who might genuinely like what they
              offer.
            </p>
            <p>
              If today’s sponsor interests you, you can choose to connect with
              them.
            </p>
            <p>
              If you do, the sponsor pays {host} for the introduction.
            </p>
            <p className="text-honey">You pay $0.</p>
          </div>
        </div>
        <div className="space-y-3">
          <Link
            href={`/p/${paw.token}/sponsor`}
            className="flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.12em] text-ink"
          >
            SEE TODAY’S SPONSOR
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

"use client";

import { CANONICAL_HOST, pawScanUrl } from "@/lib/config";
import type { PawRecord } from "@/lib/paws";
import { PawDomain, PawPrint } from "@/components/paw/PawPrint";
import Link from "next/link";

type PrintSignProps = {
  paw: PawRecord;
  origin: string;
  localHref: string;
  productionHref: string;
  usingLocal: boolean;
};

export function PrintSign({
  paw,
  origin,
  localHref,
  productionHref,
  usingLocal,
}: PrintSignProps) {
  const scanUrl = pawScanUrl(paw.token, origin);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[5in] flex-col items-center justify-between px-8 py-8 print:max-w-none print:px-10 print:py-10">
        <p className="font-condensed text-center text-5xl font-semibold tracking-[0.18em] print:text-6xl">
          SCAN THE PAW
        </p>

        <PawPrint
          scanUrl={scanUrl}
          className="w-[min(78%,20rem)] text-ink"
          label={`Scan this BearGo at ${paw.hostDisplayName}`}
        />

        <div className="space-y-3 text-center">
          <p className="font-condensed text-3xl font-semibold tracking-[0.22em] print:text-4xl">
            DON’T DROP THE DRINKS
          </p>
          <p className="font-display text-2xl leading-tight print:text-3xl">
            Who at this table would drop the drinks first?
          </p>
          <PawDomain className="font-condensed text-lg tracking-[0.28em] text-ink-soft uppercase" />
          <p className="text-sm text-ink-soft">~1 minute</p>
        </div>

        <p className="text-xs tracking-wide text-ink-soft">
          {paw.hostDisplayName} · {paw.token}
        </p>
      </div>

      <div className="print:hidden mx-auto max-w-md space-y-3 px-6 pb-10 text-center text-sm text-ink-soft">
        <p>
          QR points to <span className="break-all text-ink">{scanUrl}</span>
        </p>
        <p>
          {usingLocal ? (
            <>
              Testing on this device.{" "}
              <Link
                className="underline decoration-honey underline-offset-4"
                href={productionHref}
              >
                Print for {CANONICAL_HOST}
              </Link>
            </>
          ) : (
            <>
              Production print.{" "}
              <Link
                className="underline decoration-honey underline-offset-4"
                href={localHref}
              >
                Point QR at this computer instead
              </Link>
            </>
          )}
        </p>
        <button
          type="button"
          className="rounded-full bg-ink px-5 py-2 text-paper"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { loadAttempt } from "@/lib/attempt";
import { HEAD_INVITE, answersReady, headInviteTitle, nextPlayPath } from "@/lib/play-rounds";
import type { PawRecord } from "@/lib/paws";
import { formatWobble } from "@/lib/stack";

export function BrainInvite({ paw }: { paw: PawRecord }) {
  const router = useRouter();
  const [wobble, setWobble] = useState<number | null>(null);
  const [title, setTitle] = useState(headInviteTitle(0, 12));

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (!attempt || attempt.stackWobble == null) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    if (answersReady(attempt)) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    setWobble(attempt.stackWobble);
    setTitle(
      headInviteTitle(attempt.stackLost ?? 0, attempt.stackPacked ?? 12),
    );
  }, [paw.token, router]);

  if (wobble == null) {
    return (
      <ScannerShell>
        <div className="flex-1" />
      </ScannerShell>
    );
  }

  return (
    <ScannerShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center">
          <BearGuide state="celebrate" size="md" />
          <p className="mt-3 font-condensed text-sm tracking-[0.22em] text-honey">
            WOBBLE {formatWobble(wobble)}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <div className="mt-6 max-w-[20rem] space-y-3 leading-snug">
            {HEAD_INVITE.lines.map((line, index) => (
              <p
                key={line}
                className={
                  index === 0
                    ? "text-lg text-paper/85"
                    : "font-condensed text-base tracking-[0.14em] text-paper/65"
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col items-center pt-3">
          <Link
            href={`/p/${paw.token}/play`}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            {HEAD_INVITE.cta}
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StackRound } from "@/components/lab/stack/StackRound";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import "@/components/lab/stack/stack.css";
import { loadAttempt, saveAttempt, type AttemptSnapshot } from "@/lib/attempt";
import { nextPlayPath } from "@/lib/play-rounds";
import type { PawRecord } from "@/lib/paws";
import type { StackCarryResult } from "@/components/lab/stack/StackRound";
import { wobbleTenths, type StackRoundSeed } from "@/lib/stack";

export function StackPlay({
  paw,
  seed,
}: {
  paw: PawRecord;
  seed: StackRoundSeed;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Back button after a finished run: straight to the rank.
    const attempt = loadAttempt(paw.token);
    if (attempt?.stackWobble != null && paw.token !== "demo") {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    setReady(true);
  }, [paw.token, router]);

  async function complete(results: StackCarryResult[]) {
    if (submitting) return;
    setSubmitting(true);
    const carries = results.map((row) => ({
      glasses: row.glasses,
      wobble: row.wobble,
    }));
    const total = carries.reduce((sum, row) => sum + row.wobble, 0);
    // Save locally first so a flaky bar connection never forces a replay.
    const local: AttemptSnapshot = {
      correctCount: 0,
      totalResponseMs: 0,
      stackWobble: wobbleTenths(total),
      carryWobbles: carries.map((row) => row.wobble),
      stackCarries: carries,
      finishedAt: Date.now(),
    };
    saveAttempt(paw.token, local);
    router.push(nextPlayPath(paw.token, local));
  }

  if (!ready) {
    return (
      <ScannerShell>
        <div className="flex-1" />
      </ScannerShell>
    );
  }

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_started" />
      <StackRound live seed={seed} onComplete={complete} />
    </ScannerShell>
  );
}

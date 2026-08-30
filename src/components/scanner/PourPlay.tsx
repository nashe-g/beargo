"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PourRound } from "@/components/lab/pour/PourRound";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import "@/components/lab/pour/pour.css";
import { loadAttempt, saveAttempt } from "@/lib/attempt";
import type { PawRecord } from "@/lib/paws";
import type { PourRoundSeed } from "@/lib/pour";

export function PourPlay({
  paw,
  seed,
}: {
  paw: PawRecord;
  seed: PourRoundSeed;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (attempt?.rank != null) {
      router.replace(`/p/${paw.token}/result`);
      return;
    }
    if (!attempt?.answers || attempt.answers.length !== 3) {
      router.replace(`/p/${paw.token}/play`);
      return;
    }
    setReady(true);
  }, [paw.token, router]);

  async function complete(fills: number[]) {
    if (submitting) return;
    const attempt = loadAttempt(paw.token);
    if (!attempt?.answers) {
      router.replace(`/p/${paw.token}/play`);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/p/${paw.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: attempt.answers, pourFills: fills }),
      });
      if (response.ok) {
        const ranked = (await response.json()) as {
          correctCount: number;
          totalResponseMs: number;
          pourMg?: number;
          rank: number;
          playerCount: number;
          playersBeaten: number;
        };
        saveAttempt(paw.token, {
          ...attempt,
          correctCount: ranked.correctCount,
          totalResponseMs: ranked.totalResponseMs,
          pourMg: ranked.pourMg,
          rank: ranked.rank,
          playerCount: ranked.playerCount,
          playersBeaten: ranked.playersBeaten,
          finishedAt: Date.now(),
        });
      }
    } catch {
      saveAttempt(paw.token, attempt);
    }
    router.push(`/p/${paw.token}/result`);
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
      <PourRound live seed={seed} onComplete={complete} />
    </ScannerShell>
  );
}

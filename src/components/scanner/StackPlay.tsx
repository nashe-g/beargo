"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StackRound } from "@/components/lab/stack/StackRound";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import "@/components/lab/stack/stack.css";
import { attemptNeedsSkill, loadAttempt, saveAttempt } from "@/lib/attempt";
import type { PawRecord } from "@/lib/paws";
import type { StackCarryResult } from "@/components/lab/stack/StackRound";
import type { StackRoundSeed } from "@/lib/stack";

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
    function openIfReady() {
      const attempt = loadAttempt(paw.token);
      if (attemptNeedsSkill(attempt) && attempt?.stackWobble == null) {
        setReady(true);
        return true;
      }
      if (attempt?.stackWobble != null) {
        router.replace(`/p/${paw.token}/result`);
        return true;
      }
      return false;
    }

    if (openIfReady()) return;
    const retry = window.setTimeout(() => {
      if (openIfReady()) return;
      router.replace(`/p/${paw.token}/play`);
    }, 80);
    return () => window.clearTimeout(retry);
  }, [paw.token, router]);

  async function complete(results: StackCarryResult[]) {
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
        body: JSON.stringify({
          answers: attempt.answers,
          stackCarries: results.map((row) => ({
            glasses: row.glasses,
            wobble: row.wobble,
          })),
        }),
      });
      if (response.ok) {
        const ranked = (await response.json()) as {
          correctCount: number;
          totalResponseMs: number;
          stackWobble?: number;
          rank: number;
          playerCount: number;
          playersBeaten: number;
        };
        saveAttempt(paw.token, {
          ...attempt,
          correctCount: ranked.correctCount,
          totalResponseMs: ranked.totalResponseMs,
          stackWobble: ranked.stackWobble,
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
      <StackRound live seed={seed} onComplete={complete} />
    </ScannerShell>
  );
}

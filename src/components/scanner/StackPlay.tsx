"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StackRound } from "@/components/lab/stack/StackRound";
import { RoundIntro } from "@/components/scanner/RoundIntro";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import "@/components/lab/stack/stack.css";
import { attemptNeedsStack, loadAttempt, saveAttempt } from "@/lib/attempt";
import { POUR_ENABLED } from "@/lib/config";
import type { PawRecord } from "@/lib/paws";
import { afterPourLine, nextPlayPath } from "@/lib/play-rounds";
import type { StackCarryResult } from "@/components/lab/stack/StackRound";
import { scoreStackRound, type StackRoundSeed } from "@/lib/stack";

export function StackPlay({
  paw,
  seed,
}: {
  paw: PawRecord;
  seed: StackRoundSeed;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function openIfReady() {
      const attempt = loadAttempt(paw.token);
      if (attemptNeedsStack(attempt)) {
        setReady(true);
        return true;
      }
      if (attempt) {
        router.replace(nextPlayPath(paw.token, attempt));
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
    if (POUR_ENABLED && attempt.pourFills == null) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    setSubmitting(true);
    const carries = results.map((row) => ({
      glasses: row.glasses,
      wobble: row.wobble,
    }));
    const scored = scoreStackRound(seed.date, paw.hostId, carries);
    const local = {
      ...attempt,
      stackWobble: scored?.stackWobble,
      finishedAt: Date.now(),
    };
    saveAttempt(paw.token, local);

    try {
      const response = await fetch(`/api/p/${paw.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: attempt.answers,
          pourFills: attempt.pourFills,
          stackCarries: carries,
        }),
      });
      if (response.ok) {
        const ranked = (await response.json()) as {
          correctCount: number;
          totalResponseMs: number;
          pourMg?: number;
          stackWobble?: number;
          rank: number;
          playerCount: number;
          playersBeaten: number;
        };
        saveAttempt(paw.token, {
          ...local,
          correctCount: ranked.correctCount,
          totalResponseMs: ranked.totalResponseMs,
          pourMg: ranked.pourMg ?? local.pourMg,
          stackWobble: ranked.stackWobble,
          rank: ranked.rank,
          playerCount: ranked.playerCount,
          playersBeaten: ranked.playersBeaten,
        });
      }
    } catch {
      saveAttempt(paw.token, local);
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

  if (intro) {
    return (
      <ScannerShell>
        <RoundIntro
          round="stack"
          kicker={afterPourLine()}
          onGo={() => setIntro(false)}
        />
      </ScannerShell>
    );
  }

  return (
    <ScannerShell>
      <StackRound live seed={seed} onComplete={complete} />
    </ScannerShell>
  );
}

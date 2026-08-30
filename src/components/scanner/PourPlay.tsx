"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PourRound } from "@/components/lab/pour/PourRound";
import { RoundIntro } from "@/components/scanner/RoundIntro";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import "@/components/lab/pour/pour.css";
import { attemptNeedsPour, loadAttempt, saveAttempt } from "@/lib/attempt";
import { STACK_ENABLED } from "@/lib/config";
import type { PawRecord } from "@/lib/paws";
import { afterTriviaRoast, nextPlayPath } from "@/lib/play-rounds";
import { scorePourRound, type PourRoundSeed } from "@/lib/pour";

export function PourPlay({
  paw,
  seed,
}: {
  paw: PawRecord;
  seed: PourRoundSeed;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function openIfReady() {
      const attempt = loadAttempt(paw.token);
      if (attemptNeedsPour(attempt)) {
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

  async function complete(fills: number[]) {
    if (submitting) return;
    const attempt = loadAttempt(paw.token);
    if (!attempt?.answers) {
      router.replace(`/p/${paw.token}/play`);
      return;
    }
    setSubmitting(true);
    const scored = scorePourRound(seed.date, paw.hostId, fills);
    const next = {
      ...attempt,
      pourFills: fills,
      pourMg: scored?.pourMg,
      finishedAt: Date.now(),
    };
    saveAttempt(paw.token, next);

    if (STACK_ENABLED) {
      router.push(nextPlayPath(paw.token, next));
      return;
    }

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
          ...next,
          correctCount: ranked.correctCount,
          totalResponseMs: ranked.totalResponseMs,
          pourMg: ranked.pourMg,
          rank: ranked.rank,
          playerCount: ranked.playerCount,
          playersBeaten: ranked.playersBeaten,
        });
      }
    } catch {
      saveAttempt(paw.token, next);
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
          round="pour"
          kicker={afterTriviaRoast(loadAttempt(paw.token)?.correctCount ?? 0)}
          onGo={() => setIntro(false)}
        />
      </ScannerShell>
    );
  }

  return (
    <ScannerShell>
      <PourRound
        live
        seed={seed}
        lastCta={STACK_ENABLED ? "Next, the tray" : "See rank"}
        onComplete={complete}
      />
    </ScannerShell>
  );
}

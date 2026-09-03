"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StackRound } from "@/components/lab/stack/StackRound";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import "@/components/lab/stack/stack.css";
import { loadAttempt, saveAttempt, type AttemptSnapshot } from "@/lib/attempt";
import { hubPath, resultPath } from "@/lib/play-kind";
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
  const [error, setError] = useState("");

  useEffect(() => {
    const attempt = loadAttempt(paw.token, "stack");
    if (attempt?.stackWobble != null && paw.token !== "demo") {
      router.replace(resultPath(paw.token, "stack"));
      return;
    }
    setReady(true);
  }, [paw.token, router]);

  async function complete(results: StackCarryResult[]) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const carries = results.map((row) => ({
      glasses: row.glasses,
      wobble: row.wobble,
    }));
    const total = carries.reduce((sum, row) => sum + row.wobble, 0);
    const stackLost = results.reduce(
      (sum, row) => sum + (row.toppled ? row.glasses : row.lost),
      0,
    );
    const stackPacked = results.reduce((sum, row) => sum + row.glasses, 0);
    const local: AttemptSnapshot = {
      correctCount: 0,
      totalResponseMs: 0,
      stackWobble: wobbleTenths(total),
      carryWobbles: carries.map((row) => row.wobble),
      stackCarries: carries,
      stackLost,
      stackPacked,
      finishedAt: Date.now(),
    };
    saveAttempt(paw.token, local, "stack");
    try {
      const response = await fetch(`/api/p/${paw.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "stack", stackCarries: carries }),
      });
      if (response.ok) {
        const ranked = (await response.json()) as AttemptSnapshot & {
          boardName?: string;
        };
        saveAttempt(
          paw.token,
          {
            ...local,
            boardName: ranked.boardName ?? local.boardName,
            rank: ranked.rank,
            playerCount: ranked.playerCount,
            playersBeaten: ranked.playersBeaten,
            neighbors: ranked.neighbors,
            topWobbles: ranked.topWobbles,
            stackWobble: ranked.stackWobble ?? local.stackWobble,
          },
          "stack",
        );
      }
    } catch {
      setError("Couldn’t lock the rank. Your tray is saved.");
    }
    router.push(resultPath(paw.token, "stack"));
  }

  if (!ready) {
    return (
      <ScannerShell homeHref={hubPath(paw.token)}>
        <div className="flex-1" />
      </ScannerShell>
    );
  }

  return (
    <ScannerShell homeHref={hubPath(paw.token)}>
      <StampSession pawToken={paw.token} event="game_started" />
      {error ? (
        <p className="pb-2 text-center text-sm text-clay">{error}</p>
      ) : null}
      <StackRound live seed={seed} onComplete={complete} />
    </ScannerShell>
  );
}

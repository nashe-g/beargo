"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { loadAttempt, saveAttempt } from "@/lib/attempt";
import { sanitizeBoardName } from "@/lib/board-name";
import { answersReady, nextPlayPath } from "@/lib/play-rounds";
import type { PawRecord } from "@/lib/paws";

export function NameBoard({ paw }: { paw: PawRecord }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const attempt = loadAttempt(paw.token);
    if (!attempt || !answersReady(attempt)) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    if (attempt.boardName) {
      router.replace(`/p/${paw.token}/result`);
      return;
    }
    setReady(true);
  }, [paw.token, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const boardName = sanitizeBoardName(name);
    if (!boardName) {
      setError("Two to sixteen letters. That’s the board.");
      return;
    }
    const attempt = loadAttempt(paw.token);
    if (!attempt?.answers || !attempt.stackCarries) {
      router.replace(nextPlayPath(paw.token, attempt));
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/p/${paw.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: attempt.answers,
          stackCarries: attempt.stackCarries,
          boardName,
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
          boardName?: string;
          neighbors?: {
            rank: number;
            name: string;
            correctCount: number;
            stackWobble: number;
            totalResponseMs: number;
            mine: boolean;
          }[];
        };
        saveAttempt(paw.token, {
          ...attempt,
          boardName: ranked.boardName ?? boardName,
          correctCount: ranked.correctCount,
          totalResponseMs: ranked.totalResponseMs,
          stackWobble: ranked.stackWobble ?? attempt.stackWobble,
          rank: ranked.rank,
          playerCount: ranked.playerCount,
          playersBeaten: ranked.playersBeaten,
          neighbors: ranked.neighbors,
        });
      } else {
        setError("Couldn’t lock the rank. Try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      setError("Couldn’t lock the rank. Try again.");
      setSubmitting(false);
      return;
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
      <form
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center">
          <BearGuide state="arrive" size="md" />
          <p className="mt-3 text-sm tracking-[0.22em] text-honey uppercase">
            Tonight at {paw.hostDisplayName}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Name for the board.
          </h1>
          <p className="mt-4 max-w-[19rem] text-lg text-paper/85">
            This is what the bar sees. Keep it short.
          </p>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            maxLength={16}
            autoComplete="nickname"
            autoFocus
            placeholder="Your name"
            aria-label="Leaderboard name"
            className="mt-8 h-14 w-full max-w-[20rem] rounded-full border border-paper/20 bg-paper/8 px-6 text-center text-lg text-paper outline-none placeholder:text-paper/35 focus:border-honey"
          />
          {error ? (
            <p className="mt-3 text-sm text-clay">{error}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-honey flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink disabled:opacity-60"
        >
          {submitting ? "Saving…" : "See rank"}
        </button>
      </form>
    </ScannerShell>
  );
}

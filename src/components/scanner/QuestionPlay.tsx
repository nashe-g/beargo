"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { saveAttempt } from "@/lib/attempt";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import { StampSession } from "@/components/scanner/StampSession";
import type { DailyChallenge } from "@/lib/daily-challenge";
import type { PawRecord } from "@/lib/paws";

type Phase = "asking" | "feedback";

type Answered = {
  questionId: string;
  choiceId: string;
  responseMs: number;
};

export function QuestionPlay({
  paw,
  challenge,
}: {
  paw: PawRecord;
  challenge: DailyChallenge;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("asking");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bearState, setBearState] = useState<BearState>("idle");
  const [answers, setAnswers] = useState<Answered[]>([]);
  const questionStartedAt = useRef(0);
  const advanceTimer = useRef<number>(0);

  const question = challenge.questions[index];

  useEffect(() => {
    questionStartedAt.current = performance.now();
  }, [index]);

  useEffect(() => {
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  function answer(choiceId: string) {
    if (phase !== "asking") return;

    const elapsed = Math.max(0, performance.now() - questionStartedAt.current);
    const nextAnswers = [
      ...answers,
      {
        questionId: question.id,
        choiceId,
        responseMs: Math.round(elapsed),
      },
    ];
    const correct = choiceId === question.correctId;

    setSelectedId(choiceId);
    setPhase("feedback");
    setBearState(correct ? "reactCorrect" : "reactWrong");
    setAnswers(nextAnswers);

    const pause = BEAR_DURATIONS.reactCorrect + 700;
    advanceTimer.current = window.setTimeout(async () => {
      const isLast = index === challenge.questions.length - 1;
      if (isLast) {
        const snapshot = {
          correctCount: nextAnswers.filter((entry, entryIndex) => {
            return (
              entry.choiceId === challenge.questions[entryIndex]?.correctId
            );
          }).length,
          totalResponseMs: nextAnswers.reduce(
            (sum, entry) => sum + entry.responseMs,
            0,
          ),
          finishedAt: Date.now(),
        };

        try {
          const response = await fetch(`/api/p/${paw.token}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: nextAnswers }),
          });
          if (response.ok) {
            const ranked = (await response.json()) as {
              correctCount: number;
              totalResponseMs: number;
              rank: number;
              playerCount: number;
              playersBeaten: number;
            };
            saveAttempt(paw.token, {
              ...snapshot,
              correctCount: ranked.correctCount,
              totalResponseMs: ranked.totalResponseMs,
              rank: ranked.rank,
              playerCount: ranked.playerCount,
              playersBeaten: ranked.playersBeaten,
            });
          } else {
            saveAttempt(paw.token, snapshot);
          }
        } catch {
          saveAttempt(paw.token, snapshot);
        }

        router.push(`/p/${paw.token}/result`);
        return;
      }

      setIndex((value) => value + 1);
      setPhase("asking");
      setSelectedId(null);
      setBearState("idle");
    }, pause);
  }

  return (
    <ScannerShell>
      <StampSession pawToken={paw.token} event="game_started" />
      <div className="flex flex-1 flex-col gap-4 pt-2 sm:gap-5">
        <div className="flex items-center justify-between">
          <p className="text-sm tracking-[0.2em] text-paper/55 uppercase">
            {index + 1} / {challenge.questions.length}
          </p>
          <BearGuide state={bearState} size="sm" />
        </div>

        <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
          {question.prompt}
        </h1>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice) => {
            const chosen = selectedId === choice.id;
            const reveal = phase === "feedback";
            const correctChoice = choice.id === question.correctId;
            let tone =
              "border-paper/15 bg-paper/8 active:scale-[0.99] active:bg-paper/12";
            if (reveal && correctChoice) tone = "border-moss bg-moss text-paper";
            if (reveal && chosen && !correctChoice) {
              tone = "border-clay bg-clay text-paper";
            }

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => answer(choice.id)}
                disabled={phase === "feedback"}
                className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-base transition sm:text-lg ${tone}`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {phase === "feedback" ? (
          <div className="space-y-2">
            <p className="text-paper/75">{question.explanation}</p>
            {question.conversationHook ? (
              <p className="text-honey/90">{question.conversationHook}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ScannerShell>
  );
}

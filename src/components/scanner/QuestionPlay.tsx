"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import {
  loadAttempt,
  saveAttempt,
  type AttemptAnswer,
} from "@/lib/attempt";
import { answersReady, attemptNeedsStack } from "@/lib/play-rounds";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import { StampSession } from "@/components/scanner/StampSession";
import type { DailyChallenge } from "@/lib/daily-challenge";
import type { PawRecord } from "@/lib/paws";
import {
  PLAY_ROUNDS,
  nextHandsCta,
  nextPlayPath,
} from "@/lib/play-rounds";

type Phase = "asking" | "feedback";

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
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [review, setReview] = useState(false);
  const [ready, setReady] = useState(false);
  const [reported, setReported] = useState(false);
  const questionStartedAt = useRef(0);
  const advanceTimer = useRef<number>(0);

  const question = challenge.questions[index];
  const last = index === challenge.questions.length - 1;
  const reviewChoice =
    review
      ? answers.find((entry) => entry.questionId === question.id)?.choiceId
      : selectedId;
  const attempt = ready ? loadAttempt(paw.token) : null;
  const nextHref = nextPlayPath(paw.token, attempt);

  useEffect(() => {
    const snapshot = loadAttempt(paw.token);
    if (attemptNeedsStack(snapshot)) {
      router.replace(nextPlayPath(paw.token, snapshot));
      return;
    }
    if (answersReady(snapshot)) {
      router.replace(nextPlayPath(paw.token, snapshot));
      return;
    }
    setReady(true);
  }, [challenge.questions.length, paw.token, router]);

  useEffect(() => {
    if (review) return;
    questionStartedAt.current = performance.now();
  }, [index, review]);

  useEffect(() => {
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  function answer(choiceId: string) {
    if (review || phase !== "asking") return;

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
        const prior = loadAttempt(paw.token);
        const correctCount = nextAnswers.filter((entry) => {
          const question = challenge.questions.find(
            (row) => row.id === entry.questionId,
          );
          return question?.correctId === entry.choiceId;
        }).length;
        const snapshot = {
          correctCount,
          totalResponseMs: nextAnswers.reduce(
            (sum, entry) => sum + entry.responseMs,
            0,
          ),
          finishedAt: Date.now(),
          answers: nextAnswers,
          stackWobble: prior?.stackWobble,
          carryWobbles: prior?.carryWobbles,
          stackCarries: prior?.stackCarries,
        };
        saveAttempt(paw.token, snapshot);
        router.push(`/p/${paw.token}/name`);
        return;
      }

      setIndex((value) => value + 1);
      setPhase("asking");
      setSelectedId(null);
      setBearState("idle");
    }, pause);
  }

  function report() {
    if (reported) return;
    fetch(`/api/p/${paw.token}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id }),
    }).catch(() => undefined);
    setReported(true);
  }

  if (!ready) {
    return <ScannerShell><div className="flex-1" /></ScannerShell>;
  }

  return (
    <ScannerShell>
      {review ? null : (
        <StampSession pawToken={paw.token} event="game_started" />
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-2 sm:gap-5">
        <div className="flex items-center justify-between">
          <p className="text-sm tracking-[0.2em] text-paper/55 uppercase">
            {PLAY_ROUNDS.trivia.n} · {PLAY_ROUNDS.trivia.name}
            {" · "}
            {index + 1} / {challenge.questions.length}
            {review ? " · review" : ""}
          </p>
          <BearGuide state={bearState} size="sm" />
        </div>

        <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
          {question.prompt}
        </h1>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice) => {
            const chosen = reviewChoice === choice.id;
            const reveal = review || phase === "feedback";
            const correctChoice = choice.id === question.correctId;
            let tone =
              "border-paper/15 bg-paper/8 active:scale-[0.99] active:bg-paper/12";
            if (reveal && correctChoice) tone = "border-moss bg-moss text-paper";
            if (reveal && chosen && !correctChoice) {
              tone = "border-clay bg-clay text-paper";
            } else if (reveal && chosen && correctChoice) {
              tone = "border-moss bg-moss text-paper ring-2 ring-honey";
            }

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => answer(choice.id)}
                disabled={review || phase === "feedback"}
                className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-base transition sm:text-lg ${tone}`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {review || phase === "feedback" ? (
          <div className="space-y-2">
            <p className="text-paper/75">{question.explanation}</p>
            {question.conversationHook ? (
              <p className="text-honey/90">{question.conversationHook}</p>
            ) : null}
          </div>
        ) : null}

        {review ? (
          <div className="mt-auto space-y-4 pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  setIndex((value) => Math.max(0, value - 1));
                  setReported(false);
                }}
                className="flex h-12 flex-1 items-center justify-center rounded-full border border-paper/20 text-sm disabled:opacity-30"
              >
                Previous
              </button>
              {last ? (
                <Link
                  href={nextHref}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-honey text-sm font-semibold tracking-[0.16em] text-ink"
                >
                  {nextHandsCta(attempt)}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIndex((value) => value + 1);
                    setReported(false);
                  }}
                  className="flex h-12 flex-1 items-center justify-center rounded-full border border-paper/20 text-sm"
                >
                  Next
                </button>
              )}
            </div>
            <button
              type="button"
              className="w-full text-xs text-paper/45 underline-offset-2 hover:underline"
              onClick={report}
            >
              {reported ? "Reported. Thanks." : "Report this question"}
            </button>
          </div>
        ) : null}
      </div>
    </ScannerShell>
  );
}

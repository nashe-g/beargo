"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { NightTableView } from "@/lib/night-table-types";
import {
  waitingOnLine,
  type PublicQuestion,
} from "@/lib/table-test";

function deviceHint() {
  try {
    let id = localStorage.getItem("beargo:device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("beargo:device", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function TableTest({
  pawToken,
  table,
  onTable,
}: {
  pawToken: string;
  table: NightTableView;
  onTable: (table: NightTableView) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const startedAt = useRef(0);

  const play = table.play;
  const question: PublicQuestion | undefined = play
    ? play.questions[play.answers.length]
    : undefined;
  const waitingNames = table.members
    .filter((member) => !member.finished && !member.mine)
    .map((member) => member.nickname);

  useLayoutEffect(() => {
    if (!question) {
      setArmed(false);
      return;
    }
    setArmed(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        startedAt.current = performance.now();
        setArmed(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [question?.id]);

  async function answer(choiceId: string) {
    if (!question || !armed || busy) return;
    setBusy(true);
    setError("");
    const responseMs = Math.max(0, Math.round(performance.now() - startedAt.current));
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(pawToken)}/tables/${encodeURIComponent(table.joinCode)}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            choiceId,
            responseMs,
            deviceHint: deviceHint(),
          }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t lock that in.");
        setBusy(false);
        return;
      }
      onTable(payload);
    } catch {
      setError("Couldn’t lock that in.");
    }
    setBusy(false);
  }

  if (question && play) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm tracking-[0.18em] text-paper/55 uppercase">
            {play.answers.length + 1} of {play.questions.length}
        </p>
        <h1 className="mt-3 font-display text-[1.65rem] leading-tight">
          {question.prompt}
        </h1>
        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={!armed || busy}
              onClick={() => void answer(choice.id)}
              className="min-h-16 rounded-2xl border border-paper/15 bg-paper/8 px-4 py-3 text-left text-lg text-paper disabled:opacity-40"
            >
              {choice.label}
            </button>
          ))}
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center text-center">
      <p className="font-display text-2xl leading-tight">
        {waitingOnLine(waitingNames)}
      </p>
    </div>
  );
}

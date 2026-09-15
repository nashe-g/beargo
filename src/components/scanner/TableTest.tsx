"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { NightTableView } from "@/lib/night-table-types";
import {
  formatSeconds,
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

  if (table.reveal) {
    const reveal = table.reveal;
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm tracking-[0.18em] text-honey uppercase">
          The Table Test
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">
          {reveal.correctCount}/{reveal.asked} correct
        </h1>
        <p className="mt-2 text-lg text-paper/80">
          {formatSeconds(reveal.averageMs)} average
        </p>
        <p className="mt-1 text-sm text-honey">
          #{reveal.rank} tonight
          {reveal.tableCount > 1 ? ` · ${reveal.tableCount} tables` : ""}
        </p>
        <ul className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto">
          {reveal.people.map((person) => (
            <li
              key={person.nickname}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className={person.mine ? "text-honey" : "text-paper/85"}>
                {person.nickname}
                {person.mine ? " · you" : ""}
                {person.carried ? " · carried" : ""}
              </span>
              <span className="tabular-nums text-paper/55">
                {person.correctCount}/{person.asked} ·{" "}
                {formatSeconds(person.averageMs)}
              </span>
            </li>
          ))}
        </ul>
        <details className="shrink-0 pt-3 text-sm text-paper/45">
          <summary className="cursor-pointer text-paper/55">How we score</summary>
          <p className="mt-2 leading-relaxed">
            You have to pick. Right is your real time. Wrong is 20.0 sec and
            doesn’t count. Tables rank by correct rate, then by the average of
            each person’s time.
          </p>
        </details>
        <p className="shrink-0 pt-3 text-center text-sm text-paper/40">
          The tray is next.
        </p>
      </div>
    );
  }

  if (question) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm tracking-[0.18em] text-paper/55 uppercase">
          The Table Test · {play!.answers.length + 1} of {play!.questions.length}
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

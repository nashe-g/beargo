"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayFrame, choiceClass } from "@/components/scanner/play/PlayFrame";
import { StampSession } from "@/components/scanner/StampSession";
import { saveAttempt, type AttemptAnswer } from "@/lib/attempt";
import { BEAR_DURATIONS, type BearState } from "@/lib/bear";
import {
  defaultInteractionKind,
  type ExperienceBody,
  type ExperienceInteraction,
} from "@/lib/experience";
import { pawProgress, resolvePayoff, type PlayAnswer } from "@/lib/play";
import type { TodayPlay } from "@/lib/play-session";
import type { PawRecord } from "@/lib/paws";

export type GamePlayProps = {
  session: Pick<TodayPlay, "body"> & Partial<Omit<TodayPlay, "body">>;
  paw?: PawRecord;
  preview?: boolean;
  onPreviewComplete?: (payoff: ReturnType<typeof resolvePayoff>) => void;
};

export function GamePlay({
  paw,
  session,
  preview = false,
  onPreviewComplete,
}: GamePlayProps) {
  const router = useRouter();
  const body = session.body;
  const total = Math.max(1, body.interactions.length);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<PlayAnswer[]>([]);
  const [bearState, setBearState] = useState<BearState>("idle");
  const [locked, setLocked] = useState(false);
  const [previewPayoff, setPreviewPayoff] = useState<ReturnType<
    typeof resolvePayoff
  > | null>(null);
  const startedAt = useRef(0);
  const timer = useRef(0);

  const interaction = body.interactions[Math.min(index, body.interactions.length - 1)];
  const kind = interaction
    ? defaultInteractionKind(body.format, interaction, body.interactions.length)
    : "single";

  useEffect(() => {
    startedAt.current = performance.now();
    setLocked(false);
    setBearState("idle");
  }, [index]);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  async function finish(nextAnswers: PlayAnswer[]) {
    const payoff = resolvePayoff(body, nextAnswers);
    if (preview) {
      setPreviewPayoff(payoff);
      onPreviewComplete?.(payoff);
      return;
    }
    if (!paw) return;
    const snapshot = {
      format: body.format,
      correctCount: payoff.correctCount,
      questionCount: payoff.questionCount,
      totalResponseMs: nextAnswers.reduce((sum, answer) => sum + answer.responseMs, 0),
      finishedAt: Date.now(),
      headline: payoff.headline,
      body: payoff.body,
      scoreLine: payoff.scoreLine,
      answers: nextAnswers as AttemptAnswer[],
    };
    saveAttempt(paw.token, snapshot);
    try {
      const response = await fetch(`/api/p/${paw.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: nextAnswers }),
      });
      if (response.ok) {
        const scored = (await response.json()) as typeof snapshot;
        saveAttempt(paw.token, { ...snapshot, ...scored, finishedAt: snapshot.finishedAt, answers: nextAnswers });
      }
    } catch {
      /* snapshot already stored */
    }
    router.push(`/p/${paw.token}/result`);
  }

  function elapsed() {
    return Math.max(0, Math.round(performance.now() - startedAt.current));
  }

  function reactThen(state: BearState, fn: () => void) {
    setBearState(state);
    const wait =
      BEAR_DURATIONS[state] +
      (state === "reactCorrect" || state === "reactWrong" ? 700 : 320);
    timer.current = window.setTimeout(fn, wait);
  }

  function commit(answer: PlayAnswer, reaction: BearState) {
    if (locked) return;
    setLocked(true);
    const nextAnswers = [...answers.filter((item) => item.interactionId !== answer.interactionId), answer];
    setAnswers(nextAnswers);
    reactThen(reaction, () => {
      if (index + 1 >= total) {
        void finish(nextAnswers);
        return;
      }
      setIndex((value) => value + 1);
    });
  }

  if (preview && previewPayoff) {
    return (
      <PlayFrame
        index={total}
        total={total}
        bearState="celebrate"
        progress={{ filledToes: 4, padFilled: true }}
        embedded
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          {previewPayoff.scoreLine ? (
            <p className="font-display text-4xl">{previewPayoff.scoreLine}</p>
          ) : null}
          <h1 className="font-display text-2xl leading-tight">
            {previewPayoff.headline}
          </h1>
          <p className="max-w-[18rem] text-paper/75">{previewPayoff.body}</p>
          <p className="text-sm text-paper/45">Preview only — not published.</p>
        </div>
      </PlayFrame>
    );
  }

  return (
    <PlayFrame
      index={index}
      total={total}
      bearState={bearState}
      progress={pawProgress(index, total)}
      embedded={preview}
    >
      {paw && !preview ? (
        <StampSession pawToken={paw.token} event="game_started" />
      ) : null}
      {kind === "multi" ? (
        <MultiStep
          key={interaction.id}
          interaction={interaction}
          disabled={locked}
          onDone={(choiceIds) =>
            commit(
              { interactionId: interaction.id, choiceIds, responseMs: elapsed() },
              "reactAck",
            )
          }
        />
      ) : kind === "rank" ? (
        <RankStep
          key={interaction.id}
          interaction={interaction}
          disabled={locked}
          onDone={(order) =>
            commit(
              { interactionId: interaction.id, choiceIds: order, order, responseMs: elapsed() },
              "reactAck",
            )
          }
        />
      ) : kind === "recall" ? (
        <RecallStep
          key={interaction.id}
          interaction={interaction}
          disabled={locked}
          onDone={(text) =>
            commit(
              { interactionId: interaction.id, choiceIds: [], text, responseMs: elapsed() },
              "reactAck",
            )
          }
        />
      ) : kind === "text" ? (
        <TextStep
          key={interaction.id}
          interaction={interaction}
          disabled={locked}
          onDone={(text) =>
            commit(
              { interactionId: interaction.id, choiceIds: [], text, responseMs: elapsed() },
              "reactAck",
            )
          }
        />
      ) : kind === "showdown" ? (
        <ShowdownStep
          key={interaction.id}
          interaction={interaction}
          disabled={locked}
          onDone={(choiceId) =>
            commit(
              { interactionId: interaction.id, choiceIds: [choiceId], responseMs: elapsed() },
              "reactAck",
            )
          }
        />
      ) : (
        <ChoiceStep
          key={interaction.id}
          body={body}
          interaction={interaction}
          kind={kind}
          disabled={locked}
          onPick={(choiceId) => {
            const correct = interaction.correctId
              ? choiceId === interaction.correctId
              : true;
            const scored = Boolean(interaction.correctId);
            commit(
              { interactionId: interaction.id, choiceIds: [choiceId], responseMs: elapsed() },
              scored ? (correct ? "reactCorrect" : "reactWrong") : "reactAck",
            );
          }}
        />
      )}
    </PlayFrame>
  );
}

function ChoiceStep({
  body,
  interaction,
  kind,
  disabled,
  onPick,
}: {
  body: ExperienceBody;
  interaction: ExperienceInteraction;
  kind: string;
  disabled: boolean;
  onPick: (choiceId: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const scored = Boolean(interaction.correctId);
  const choices = interaction.choices ?? [];

  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <div className="flex flex-col gap-3">
        {choices.map((choice) => {
          const chosen = picked === choice.id;
          const reveal = scored && picked;
          let tone = choiceClass;
          if (reveal && choice.id === interaction.correctId) {
            tone = "min-h-14 rounded-2xl border border-moss bg-moss px-4 py-3 text-left text-paper";
          } else if (reveal && chosen) {
            tone = "min-h-14 rounded-2xl border border-clay bg-clay px-4 py-3 text-left text-paper";
          } else if (chosen) {
            tone = `${choiceClass} ring-2 ring-honey`;
          }
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (picked) return;
                setPicked(choice.id);
                onPick(choice.id);
              }}
              className={tone}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {scored && picked && interaction.explanation ? (
        <p className="text-paper/75">{interaction.explanation}</p>
      ) : null}
      {picked && interaction.conversationHook && body.format === "Quick Trivia" ? (
        <p className="text-honey/90">{interaction.conversationHook}</p>
      ) : null}
    </>
  );
}

function MultiStep({
  interaction,
  disabled,
  onDone,
}: {
  interaction: ExperienceInteraction;
  disabled: boolean;
  onDone: (choiceIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <p className="text-sm text-paper/55">Tap all that apply.</p>
      <div className="flex flex-col gap-3">
        {(interaction.choices ?? []).map((choice) => {
          const on = selected.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                setSelected((current) =>
                  current.includes(choice.id)
                    ? current.filter((id) => id !== choice.id)
                    : [...current, choice.id],
                )
              }
              className={`${choiceClass} ${on ? "ring-2 ring-honey bg-honey/15" : ""}`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDone(selected)}
        className="btn-honey mt-auto flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.16em] text-ink"
      >
        CONTINUE
      </button>
    </>
  );
}

function RankStep({
  interaction,
  disabled,
  onDone,
}: {
  interaction: ExperienceInteraction;
  disabled: boolean;
  onDone: (order: string[]) => void;
}) {
  const items = interaction.choices ?? [];
  const [order, setOrder] = useState<string[]>([]);
  const remaining = items.filter((item) => !order.includes(item.id));

  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <p className="text-sm text-paper/55">Tap in order. First tap is #1.</p>
      {order.length > 0 ? (
        <ol className="space-y-2 text-paper/80">
          {order.map((id, index) => (
            <li key={id}>
              {index + 1}. {items.find((item) => item.id === id)?.label}
            </li>
          ))}
        </ol>
      ) : null}
      <div className="flex flex-col gap-3">
        {remaining.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = [...order, choice.id];
              setOrder(next);
              if (next.length === items.length) onDone(next);
            }}
            className={choiceClass}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </>
  );
}

function RecallStep({
  interaction,
  disabled,
  onDone,
}: {
  interaction: ExperienceInteraction;
  disabled: boolean;
  onDone: (text: string) => void;
}) {
  const seconds = interaction.timeLimitSeconds || 20;
  const itemsRef = useRef<string[]>([]);
  const valueRef = useRef("");
  const [left, setLeft] = useState(seconds);
  const [value, setValue] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const done = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          if (!done.current) {
            done.current = true;
            onDone(
              [...itemsRef.current, valueRef.current]
                .filter((item) => item.trim())
                .join("\n"),
            );
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function add() {
    const next = value.trim();
    if (!next) return;
    setItems((current) => [...current, next]);
    setValue("");
  }

  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <p className="font-condensed text-3xl text-honey">{left}s</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled || left === 0}
          placeholder={interaction.placeholder || "Type one, then enter"}
          className="h-14 flex-1 rounded-2xl border border-paper/20 bg-paper/8 px-4 text-paper"
        />
        <button
          type="submit"
          disabled={disabled || left === 0}
          className="h-14 rounded-2xl bg-honey px-4 font-semibold text-ink"
        >
          Add
        </button>
      </form>
      <ul className="space-y-1 text-paper/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (done.current) return;
          done.current = true;
          onDone([...items, value].filter((item) => item.trim()).join("\n"));
        }}
        className="mt-auto flex h-12 items-center justify-center rounded-full border border-paper/20 text-sm"
      >
        I’m done
      </button>
    </>
  );
}

function TextStep({
  interaction,
  disabled,
  onDone,
}: {
  interaction: ExperienceInteraction;
  disabled: boolean;
  onDone: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        placeholder={interaction.placeholder || "Type here"}
        className="h-14 w-full rounded-2xl border border-paper/20 bg-paper/8 px-4 text-paper"
      />
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={() => onDone(value.trim())}
        className="btn-honey mt-auto flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.16em] text-ink disabled:opacity-40"
      >
        CONTINUE
      </button>
    </>
  );
}

function ShowdownStep({
  interaction,
  disabled,
  onDone,
}: {
  interaction: ExperienceInteraction;
  disabled: boolean;
  onDone: (choiceId: string) => void;
}) {
  const all = interaction.choices ?? [];
  const [queue, setQueue] = useState(all.map((choice) => choice.id));
  const finished = useRef(false);

  useEffect(() => {
    if (queue.length === 1 && !finished.current) {
      finished.current = true;
      onDone(queue[0]);
    }
  }, [queue, onDone]);

  if (queue.length <= 1) {
    return <p className="text-paper/70">Crowning the winner…</p>;
  }

  const [a, b] = queue;
  const left = all.find((choice) => choice.id === a);
  const right = all.find((choice) => choice.id === b);

  function pick(id: string) {
    const rest = queue.slice(2);
    const next = [id, ...rest];
    setQueue(next);
  }

  return (
    <>
      <h1 className="font-display text-[1.55rem] leading-tight sm:text-[1.85rem]">
        {interaction.prompt}
      </h1>
      <p className="text-sm text-paper/55">This or that. Winner stays.</p>
      <div className="grid gap-3">
        {[left, right].map((choice) =>
          choice ? (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => pick(choice.id)}
              className={`${choiceClass} min-h-24 text-center text-xl`}
            >
              {choice.label}
            </button>
          ) : null,
        )}
      </div>
    </>
  );
}

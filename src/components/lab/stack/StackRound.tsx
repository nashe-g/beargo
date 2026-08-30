"use client";

import { useEffect, useState } from "react";
import { Patron } from "@/components/lab/pour/Patron";
import { StackPlayfield } from "@/components/lab/stack/StackPlayfield";
import { useStackCoach, type StackCoachKind } from "@/components/lab/stack/useStackCoach";
import { useStackTilt } from "@/components/lab/stack/useStackTilt";
import "./stack.css";
import { recordStackStreak } from "@/lib/stack-streak";
import {
  stackBand,
  stackPatronBand,
  stackResultCopy,
  stackScore,
  type StackCarry,
  type StackRoundSeed,
} from "@/lib/stack";

export type StackCarryResult = {
  glasses: number;
  toppled: boolean;
  wobble: number;
  band: ReturnType<typeof stackBand>;
};

export function StackCarryPlay({
  carry,
  onDone,
  coach: coachKind = "full",
  label,
  doneLabel = "Next",
}: {
  carry: StackCarry;
  onDone?: (result: StackCarryResult) => void;
  coach?: StackCoachKind;
  label?: string;
  doneLabel?: string;
}) {
  const [locked, setLocked] = useState(false);
  const coach = useStackCoach(coachKind);
  const tilt = useStackTilt(carry.glasses, carry.jolts, locked);
  const remaining = Math.max(0, carry.durationMs - tilt.elapsed);
  const band = locked ? stackBand(tilt.toppled, tilt.maxLean) : "idle";
  const wobble = stackScore(tilt.toppled, tilt.maxLean, tilt.integral);

  useEffect(() => {
    if (!coach.playing) return;
    tilt.reset({ kick: true });
    tilt.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.playing]);

  useEffect(() => {
    if (tilt.toppled) setLocked(true);
  }, [tilt.toppled]);

  useEffect(() => {
    if (!tilt.running || locked) return;
    if (tilt.elapsed >= carry.durationMs) setLocked(true);
  }, [tilt.elapsed, tilt.running, locked, carry.durationMs]);

  const result: StackCarryResult = {
    glasses: carry.glasses,
    toppled: tilt.toppled,
    wobble,
    band: stackBand(tilt.toppled, tilt.maxLean),
  };

  const headline = locked
    ? stackResultCopy(band)
    : tilt.incoming
      ? "Someone’s coming."
      : coach.playing
        ? `${(remaining / 1000).toFixed(1)}s`
        : coach.headline;

  return (
    <div className="flex flex-1 flex-col">
      <p className="font-condensed text-center text-sm tracking-[0.22em] text-honey">
        {label ?? `${carry.glasses} HIGH`}
      </p>
      <p
        className={`mt-2 text-center font-display ${coach.counting ? "text-5xl" : "text-xl"}`}
      >
        {headline}
      </p>
      {!locked && coach.playing ? (
        <p className="mt-1 text-center text-sm text-paper/55">
          Tap the arrow on the side it’s falling.
        </p>
      ) : null}
      <div className="relative mt-2 flex flex-1 flex-col justify-end">
        {tilt.incoming ? (
          <div
            className={`pointer-events-none absolute bottom-24 z-10 ${
              tilt.incoming.side < 0
                ? "left-1 stack-walk-left"
                : "right-1 stack-walk-right"
            }`}
          >
            <Patron
              id={tilt.incoming.patronId}
              reaction="close"
              className="h-20 w-14"
            />
          </div>
        ) : null}
        <StackPlayfield
          glasses={carry.glasses}
          theta={coach.playing ? tilt.theta : coach.demoTheta}
          slide={coach.playing ? tilt.slide : coach.demoSlide}
          toppled={coach.playing && tilt.toppled}
          hintSide={coach.playing ? tilt.hintSide : coach.hintSide}
          pressedSide={coach.playing ? 0 : coach.tapSide}
          disabled={locked || !coach.playing}
          onPress={(side) => {
            if (coach.playing) tilt.press(side);
          }}
          onRelease={() => {
            if (coach.playing) tilt.release();
          }}
        />
      </div>
      {locked ? (
        <div className="mt-1 text-center">
          <Patron
            id={carry.jolts[0]?.patronId ?? "a"}
            reaction={stackPatronBand(band)}
            className="mx-auto h-16 w-12"
          />
          <p className="mt-2 text-sm text-paper/70">
            {tilt.toppled ? "The stack went." : `${wobble} wobble`}
          </p>
          {onDone ? (
            <button
              type="button"
              onClick={() => onDone(result)}
              className="btn-honey mt-4 mb-2 inline-flex h-12 items-center rounded-full bg-honey px-7 font-semibold text-ink"
            >
              {doneLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StackRound({
  seed,
  onReplay,
  onComplete,
  live = false,
}: {
  seed: StackRoundSeed;
  onReplay?: () => void;
  onComplete?: (results: StackCarryResult[]) => void;
  live?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<StackCarryResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const carry = seed.carries[index];
  const last = index >= seed.carries.length - 1;

  function finishCarry(result: StackCarryResult) {
    const next = [...results];
    next[index] = result;
    setResults(next);
    if (last) {
      if (live) {
        onComplete?.(next);
        return;
      }
      setStreak(recordStackStreak(seed.date).count);
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <div
      className={
        live
          ? "flex min-h-0 flex-1 flex-col text-paper"
          : "scanner-stage overflow-hidden rounded-[1.8rem] text-paper"
      }
    >
      <div className={live ? "flex min-h-0 flex-1 flex-col px-1 py-2" : "flex min-h-[36rem] flex-col px-5 py-6"}>
        {finished ? (
          <div className="mt-6 flex flex-1 flex-col items-center text-center">
            <p className="font-condensed text-sm tracking-[0.22em] text-honey">
              ROUND
            </p>
            <p className="mt-3 font-display text-3xl">Three carries.</p>
            {streak > 1 ? (
              <p className="mt-2 text-sm text-honey">
                {streak} days in a row in this lab.
              </p>
            ) : null}
            <ul className="mt-6 w-full max-w-xs space-y-2 text-left text-sm text-paper/80">
              {seed.carries.map((row, i) => {
                const result = results[i];
                return (
                  <li
                    key={`${row.glasses}-${i}`}
                    className="flex justify-between rounded-2xl bg-paper/8 px-4 py-3"
                  >
                    <span>{row.glasses} high</span>
                    <span className="text-honey">
                      {result
                        ? `${stackResultCopy(result.band)} ${result.wobble}`
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setResults([]);
                setFinished(false);
                onReplay?.();
              }}
              className="btn-honey mt-8 h-12 rounded-full bg-honey px-7 font-semibold text-ink"
            >
              Carry again
            </button>
          </div>
        ) : carry ? (
          <StackCarryPlay
            key={`${seed.date}-${index}-${carry.glasses}`}
            carry={carry}
            coach={index === 0 ? "full" : "countdown"}
            label={`CARRY ${String(index + 1).padStart(2, "0")} / 03`}
            doneLabel={last ? (live ? "See rank" : "See round") : "Next"}
            onDone={finishCarry}
          />
        ) : null}
      </div>
    </div>
  );
}

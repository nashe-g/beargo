"use client";

import { useEffect, useRef, useState } from "react";
import { Patron } from "@/components/lab/pour/Patron";
import { StackPlayfield } from "@/components/lab/stack/StackPlayfield";
import { useStackCoach } from "@/components/lab/stack/useStackCoach";
import { useStackTilt } from "@/components/lab/stack/useStackTilt";
import "./stack.css";
import { recordStackStreak } from "@/lib/stack-streak";
import {
  carryWobble,
  stackBand,
  stackHazardLine,
  stackPatronBand,
  stackResultCopy,
  type StackCarry,
  type StackRoundSeed,
} from "@/lib/stack";
import { crashSound, stingSound } from "@/lib/stack-sound";

export type StackCarryResult = {
  glasses: number;
  toppled: boolean;
  wobble: number;
  taps: number;
  lost: number;
  band: ReturnType<typeof stackBand>;
};

export function StackCarryPlay({
  carry,
  onDone,
  label,
  doneLabel = "Next",
  auto = false,
  showShift = true,
  modifier = "REGULAR SHIFT",
}: {
  carry: StackCarry;
  onDone?: (result: StackCarryResult) => void;
  label?: string;
  doneLabel?: string;
  auto?: boolean;
  showShift?: boolean;
  modifier?: string;
}) {
  const [locked, setLocked] = useState(false);
  const [pausedByBlur, setPausedByBlur] = useState(false);
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const coach = useStackCoach();
  const tilt = useStackTilt(carry.glasses, carry.jolts, locked, modifier);
  const remaining = Math.max(0, carry.durationMs - tilt.elapsed);
  const band = locked ? stackBand(tilt.toppled, tilt.maxLean) : "idle";
  const wobble = carryWobble({
    toppled: tilt.toppled,
    maxLean: tilt.maxLean,
    integral: tilt.integral,
    taps: tilt.taps,
    durationMs: carry.durationMs,
    lost: tilt.toppled ? carry.glasses : tilt.fallen.length,
  });

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
    if (!locked) return;
    if (tilt.toppled) crashSound();
    else if (tilt.elapsed > 0) stingSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  useEffect(() => {
    if (!tilt.running || locked) return;
    if (tilt.elapsed >= carry.durationMs) setLocked(true);
  }, [tilt.elapsed, tilt.running, locked, carry.durationMs]);

  // A notification or app switch pauses the run. Nobody should lose to
  // their own phone.
  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) return;
      if (coach.playing && !locked && tilt.running) {
        tilt.stop();
        setPausedByBlur(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [coach.playing, locked, tilt.running, tilt]);

  useEffect(() => {
    if (resumeCount == null) return;
    if (resumeCount <= 0) {
      setResumeCount(null);
      setPausedByBlur(false);
      tilt.start();
      return;
    }
    const timer = setTimeout(
      () => setResumeCount((value) => (value ?? 1) - 1),
      650,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeCount]);

  const result: StackCarryResult = {
    glasses: carry.glasses,
    toppled: tilt.toppled,
    wobble,
    taps: tilt.taps,
    lost: tilt.toppled ? carry.glasses : tilt.fallen.length,
    band: stackBand(tilt.toppled, tilt.maxLean),
  };
  const resultRef = useRef(result);
  resultRef.current = result;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Keep the room moving: show the verdict for a beat, then continue.
  useEffect(() => {
    if (!locked || !auto) return;
    const timer = setTimeout(
      () => onDoneRef.current?.(resultRef.current),
      resultRef.current.toppled ? 2000 : 1500,
    );
    return () => clearTimeout(timer);
  }, [locked, auto]);

  const headline = locked
    ? tilt.toppled
      ? "Down."
      : stackResultCopy(band, tilt.fallen.length)
    : tilt.incoming
      ? stackHazardLine(tilt.incoming.kind, tilt.incoming.formation)
      : coach.playing
        ? `${(remaining / 1000).toFixed(1)}s`
        : coach.headline;

  return (
    <div className="flex flex-1 flex-col select-none">
      <p className="font-condensed text-center text-sm tracking-[0.22em] text-honey">
        {label ?? `${carry.glasses} GLASSES`}
        {showShift ? (
          <span className="mt-1 block tracking-[0.16em] text-paper/50">
            {modifier}
          </span>
        ) : null}
      </p>
      <p
        className={`mt-2 text-center font-display ${coach.counting ? "text-5xl" : "text-xl"}`}
      >
        {headline}
      </p>
      <div className="relative mt-2 flex flex-1 flex-col justify-end">
        <StackPlayfield
          glasses={carry.glasses}
          theta={coach.playing ? tilt.theta : 0}
          slide={coach.playing ? tilt.slide : 0}
          toppled={coach.playing && tilt.toppled}
          fallen={tilt.fallen}
          hintSide={coach.playing ? tilt.hintSide : 0}
          pressedSide={0}
          disabled={locked || !coach.playing || pausedByBlur}
          elapsed={coach.playing ? tilt.elapsed : 0}
          jolts={carry.jolts}
          walking={coach.playing && !locked && !pausedByBlur}
          modifier={modifier}
          onPress={(side) => {
            if (coach.playing && !pausedByBlur) tilt.press(side);
          }}
          onRelease={() => {
            if (coach.playing) tilt.release();
          }}
        />
        {pausedByBlur ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[1.2rem] bg-ink/85 text-center">
            {resumeCount != null && resumeCount > 0 ? (
              <p className="font-display text-6xl">{resumeCount}</p>
            ) : (
              <>
                <p className="font-display text-3xl">Ready?</p>
                <button
                  type="button"
                  onClick={() => setResumeCount(3)}
                  className="btn-honey mt-4 h-12 rounded-full bg-honey px-8 font-semibold text-ink"
                >
                  Go
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
      {locked ? (
        <div className="mt-1 text-center">
          <Patron
            id={carry.jolts[0]?.patronId ?? "a"}
            reaction={stackPatronBand(band)}
            className="mx-auto h-16 w-12"
          />
          <p className="mt-2 text-sm text-paper/70">
            {tilt.toppled
              ? `Spilled ${carry.glasses}. Keep walking.`
              : tilt.fallen.length
                ? `Lost ${tilt.fallen.length}. Wobble ${wobble.toFixed(1)}`
                : `Wobble ${wobble.toFixed(1)}`}
          </p>
          {onDone && !auto ? (
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
              {seed.modifier}
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
                    <span>{row.glasses} glasses</span>
                    <span className="text-honey">
                      {result
                        ? `${stackResultCopy(result.band, result.lost)} ${result.wobble.toFixed(1)}`
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
            label={`CARRY ${index + 1} OF 3 · ${carry.glasses} GLASSES`}
            doneLabel={last ? (live ? "See rank" : "See round") : "Next"}
            auto={live}
            showShift={!live}
            modifier={seed.modifier}
            onDone={finishCarry}
          />
        ) : null}
      </div>
    </div>
  );
}

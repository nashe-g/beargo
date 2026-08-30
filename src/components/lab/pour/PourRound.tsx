"use client";

import { useEffect, useState } from "react";
import { VesselGlass } from "@/components/lab/pour/VesselGlass";
import { usePourHold } from "@/components/lab/pour/usePourHold";
import { Patron } from "@/components/lab/pour/Patron";
import { recordPourStreak } from "@/lib/pour-streak";
import {
  VESSELS,
  pourBand,
  pourHeadline,
  pourMilligrams,
  pourReactionLine,
  pourResultCopy,
  type PourRoundSeed,
} from "@/lib/pour";

export function PourRound({
  seed,
  onReplay,
  onComplete,
  live = false,
}: {
  seed: PourRoundSeed;
  onReplay?: () => void;
  onComplete?: (fills: number[]) => void;
  live?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const pour = seed.pours[index];
  const spec = pour ? VESSELS[pour.vesselId] : VESSELS.pint;
  const lastPour = index >= seed.pours.length - 1;
  const hold = usePourHold(locked || !pour, spec);
  const done = finished;
  const currentFill = locked ? (results[index] ?? hold.fill) : hold.fill;
  const band = locked && pour ? pourBand(currentFill, pour.target) : "idle";
  const busy = locked || hold.landing || hold.settling;

  useEffect(() => {
    hold.reset();
    setLocked(false);
    setZoomed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, seed.date]);

  async function release() {
    if (busy || !pour) return;
    const value = await hold.finish();
    setLocked(true);
    setZoomed(true);
    setResults((rows) => {
      const next = [...rows];
      next[index] = value;
      return next;
    });
  }

  function nextPour() {
    if (lastPour) {
      if (live) {
        onComplete?.(results);
        return;
      }
      setStreak(recordPourStreak(seed.date).count);
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  const juice =
    locked && band === "nail"
      ? "pour-juice-nail"
      : locked && band === "close"
        ? "pour-juice-close"
        : "";

  return (
    <div
      className={
        live
          ? `flex min-h-0 flex-1 flex-col text-paper ${juice}`
          : `scanner-stage overflow-hidden rounded-[1.8rem] text-paper ${juice}`
      }
    >
      <div className={live ? "flex min-h-0 flex-1 flex-col" : "flex min-h-[36rem] flex-col px-5 py-6"}>
        <p className="font-condensed text-center text-sm tracking-[0.22em] text-honey">
          {done
            ? "ROUND"
            : `POUR ${String(index + 1).padStart(2, "0")} / 03`}
        </p>
        {done ? (
          <div className="mt-6 flex flex-1 flex-col items-center text-center">
            <p className="font-display text-3xl">Three glasses.</p>
            {streak > 1 ? (
              <p className="mt-2 text-sm text-honey">
                {streak} days in a row in this lab.
              </p>
            ) : null}
            <ul className="mt-6 w-full max-w-xs space-y-2 text-left text-sm text-paper/80">
              {seed.pours.map((row, i) => {
                const fill = results[i] ?? 0;
                const rowBand = pourBand(fill, row.target);
                return (
                  <li
                    key={`${row.vesselId}-${i}`}
                    className="flex justify-between rounded-2xl bg-paper/8 px-4 py-3"
                  >
                    <span>{VESSELS[row.vesselId].label}</span>
                    <span className="text-honey">
                      {pourResultCopy(rowBand)} {pourMilligrams(fill, row.target)}{" "}
                      mg
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
                setLocked(false);
                setZoomed(false);
                setFinished(false);
                hold.reset();
                onReplay?.();
              }}
              className="btn-honey mt-8 h-12 rounded-full bg-honey px-7 font-semibold text-ink"
            >
              Pour again
            </button>
          </div>
        ) : (
          <>
            <p className="mt-3 text-center font-display text-xl">Head on it</p>
            <p className="mt-1 text-center text-sm text-paper/60">
              Aim the beer. The head thins, the drink keeps rising.
            </p>
            <div className="mt-3 flex justify-center">
              <Patron
                id={pour?.patronId ?? "a"}
                reaction={band}
                className={live ? "h-24 w-16" : "h-28 w-20"}
              />
            </div>
            <button
              type="button"
              className="mt-2 flex flex-1 touch-none select-none flex-col items-center justify-end pb-4"
              onPointerDown={(event) => {
                if (busy) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                hold.start();
              }}
              onPointerUp={() => {
                void release();
              }}
              onPointerCancel={() => {
                void release();
              }}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className={`${live ? "h-[14.5rem]" : "h-[17rem]"} w-44 overflow-hidden`}>
                <VesselGlass
                  spec={spec}
                  fill={currentFill}
                  foam={hold.foam}
                  target={pour?.target ?? 0.5}
                  pouring={hold.holding || hold.landing}
                  streamCut={hold.streamCut}
                  zoomed={zoomed}
                  reveal={locked}
                  className={`${live ? "h-[14.5rem]" : "h-[17rem]"} w-44`}
                />
              </div>
              <p className="mt-4 text-sm text-paper/55">
                {locked
                  ? "\u00a0"
                  : hold.landing
                    ? "Stream landing…"
                    : hold.settling
                      ? "Head settling…"
                      : "Hold to pour. The stream still lands after you let go."}
              </p>
            </button>
            {locked && pour ? (
              <div className="mt-2 text-center">
                <p className="font-display text-3xl">
                  {pourHeadline(currentFill, pour.target)}
                </p>
                <p className="mt-1 text-sm text-paper/70">
                  {pourReactionLine(currentFill, pour.target)}
                </p>
                <button
                  type="button"
                  onClick={nextPour}
                  className="btn-honey mt-4 mb-2 inline-flex h-12 items-center rounded-full bg-honey px-7 font-semibold text-ink"
                >
                  {lastPour ? (live ? "See rank" : "See round") : "Next pour"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Patron } from "@/components/lab/pour/Patron";
import { PourRound } from "@/components/lab/pour/PourRound";
import { VesselGlass } from "@/components/lab/pour/VesselGlass";
import { usePourHold } from "@/components/lab/pour/usePourHold";
import "./pour/pour.css";
import {
  PATRON_IDS,
  VESSEL_IDS,
  VESSELS,
  chicagoPourDate,
  pourBand,
  pourMilligrams,
  seedPourRound,
  type PatronId,
  type PourBand,
  type VesselId,
} from "@/lib/pour";

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="scanner-stage overflow-hidden rounded-[1.8rem] px-5 py-8">
      {children}
    </div>
  );
}

function HoldStudio() {
  const [vesselId, setVesselId] = useState<VesselId>("pint");
  const [target, setTarget] = useState(0.55);
  const [locked, setLocked] = useState(false);
  const spec = VESSELS[vesselId];
  const hold = usePourHold(locked, spec);
  const band = locked ? pourBand(hold.fill, target) : "idle";

  async function release() {
    if (locked || hold.landing || hold.settling) return;
    await hold.finish();
    setLocked(true);
  }

  return (
    <div className="space-y-4">
      <Stage>
        <button
          type="button"
          className="mx-auto flex w-full touch-none select-none flex-col items-center"
          onPointerDown={(event) => {
            if (locked || hold.landing || hold.settling) return;
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
          <div className="h-72 w-40 overflow-hidden">
            <VesselGlass
              spec={spec}
              fill={hold.fill}
              foam={hold.foam}
              target={target}
              pouring={hold.holding || hold.landing}
              streamCut={hold.streamCut}
              zoomed={locked}
              reveal={locked}
              className="h-72 w-40"
            />
          </div>
          <p className="mt-4 text-sm text-paper/55">
            {locked
              ? `${pourMilligrams(hold.fill, target)} mg off · ${band}`
              : hold.landing
                ? "Stream landing…"
                : hold.settling
                  ? "Head settling…"
                  : "Hold to pour. The stream still lands after you let go."}
          </p>
        </button>
      </Stage>
      <div className="flex flex-wrap gap-2">
        {VESSEL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setVesselId(id);
              setLocked(false);
              hold.reset();
            }}
            className={`rounded-full px-3 py-1 text-sm ${vesselId === id ? "bg-ink text-paper" : "border border-ink/15"}`}
          >
            {VESSELS[id].label}
          </button>
        ))}
      </div>
      <label className="block text-sm text-ink-soft">
        Target {Math.round(target * 100)}%
        <input
          type="range"
          min={20}
          max={90}
          value={Math.round(target * 100)}
          onChange={(event) => {
            setTarget(Number(event.target.value) / 100);
            setLocked(false);
            hold.reset();
          }}
          className="mt-2 w-full accent-honey"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          setLocked(false);
          hold.reset();
        }}
        className="text-sm underline decoration-honey underline-offset-4"
      >
        Reset fill
      </button>
    </div>
  );
}

export function PourLab() {
  const [fill, setFill] = useState(0.35);
  const [target, setTarget] = useState(0.6);
  const [patronId, setPatronId] = useState<PatronId>("a");
  const [reaction, setReaction] = useState<PourBand>("idle");
  const [dayOffset, setDayOffset] = useState(0);
  const [replay, setReplay] = useState(0);
  const date = chicagoPourDate(dayOffset);
  const seed = useMemo(() => seedPourRound(date), [date]);

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-md space-y-12 px-6 py-10">
        <header className="space-y-2">
          <p className="font-condensed tracking-[0.25em] uppercase text-ink-soft">
            Studio
          </p>
          <h1 className="font-display text-4xl">Perfect Pour</h1>
          <p className="text-ink-soft">
            Head on it. Same tap. Your hands. Live trivia is untouched.
          </p>
          <p className="flex gap-4 text-sm">
            <Link
              href="/lab"
              className="underline decoration-honey underline-offset-4"
            >
              Motion
            </Link>
            <span className="text-ink">Pour</span>
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            01 Vessels + line
          </h2>
          <p className="text-sm text-ink-soft">
            Same target percent, three beer glasses. Half in a pint is not
            half in a weizen.
          </p>
          <Stage>
            <div className="grid grid-cols-3 items-end gap-2">
              {VESSEL_IDS.map((id) => (
                <figure key={id} className="text-center">
                  <VesselGlass
                    spec={VESSELS[id]}
                    fill={fill}
                    foam={0.1}
                    target={target}
                    className="mx-auto h-52 w-full"
                  />
                  <figcaption className="mt-2 text-xs text-paper/60">
                    {VESSELS[id].label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Stage>
          <label className="block text-sm text-ink-soft">
            Fill {Math.round(fill * 100)}%
            <input
              type="range"
              min={0}
              max={122}
              value={Math.round(fill * 100)}
              onChange={(event) => setFill(Number(event.target.value) / 100)}
              className="mt-2 w-full accent-honey"
            />
          </label>
          <label className="block text-sm text-ink-soft">
            Target {Math.round(target * 100)}%
            <input
              type="range"
              min={20}
              max={90}
              value={Math.round(target * 100)}
              onChange={(event) => setTarget(Number(event.target.value) / 100)}
              className="mt-2 w-full accent-honey"
            />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            02 Hold, stream, spill
          </h2>
          <p className="text-sm text-ink-soft">
            Hold. The tap doesn’t change. A wide bowl rises slower. What’s in
            the air still lands.
          </p>
          <HoldStudio />
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            03 Patrons
          </h2>
          <Stage>
            <div className="flex justify-center gap-6">
              {PATRON_IDS.map((id) => (
                <Patron
                  key={id}
                  id={id}
                  reaction={reaction}
                  className={
                    id === patronId ? "h-36 w-24" : "h-28 w-16 opacity-70"
                  }
                />
              ))}
            </div>
          </Stage>
          <div className="flex flex-wrap gap-2">
            {PATRON_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPatronId(id)}
                className={`rounded-full px-3 py-1 text-sm ${patronId === id ? "bg-ink text-paper" : "border border-ink/15"}`}
              >
                {id.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["idle", "nail", "close", "short", "flood"] as PourBand[]).map(
              (band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setReaction(band)}
                  className={`rounded-full px-3 py-1 text-sm ${reaction === band ? "bg-ink text-paper" : "border border-ink/15"}`}
                >
                  {band}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            04 Round
          </h2>
          <p className="text-sm text-ink-soft">
            Same tap every time. The miss is your release. After it settles,
            we zoom the gap.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDayOffset(0)}
              className={`rounded-full px-3 py-1 text-sm ${dayOffset === 0 ? "bg-ink text-paper" : "border border-ink/15"}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDayOffset(1)}
              className={`rounded-full px-3 py-1 text-sm ${dayOffset === 1 ? "bg-ink text-paper" : "border border-ink/15"}`}
            >
              Tomorrow
            </button>
          </div>
          <p className="text-xs text-ink-soft">{date}</p>
          <PourRound
            key={`${date}-${replay}`}
            seed={seed}
            onReplay={() => setReplay((value) => value + 1)}
          />
        </section>

        <p>
          <Link href="/" className="underline decoration-honey underline-offset-4">
            Back
          </Link>
        </p>
      </div>
    </main>
  );
}

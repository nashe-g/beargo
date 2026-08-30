"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BearGuide } from "@/components/bear/BearGuide";
import { PawMark } from "@/components/paw/PawMark";
import { PawPrint } from "@/components/paw/PawPrint";
import { PawProgress } from "@/components/paw/PawProgress";
import { BEAR_STATES, type BearState } from "@/lib/bear";
import { CANONICAL_ORIGIN, pawScanUrl } from "@/lib/config";

export function MotionLab() {
  const [bearState, setBearState] = useState<BearState>("arrive");
  const [tone, setTone] = useState<"onDark" | "onPaper">("onPaper");
  const [filledToes, setFilledToes] = useState(0);
  const padFilled = filledToes >= 5;
  const scanUrl = useMemo(() => pawScanUrl("demo", CANONICAL_ORIGIN), []);

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-md space-y-10 px-6 py-10">
        <header className="space-y-2">
          <p className="font-condensed tracking-[0.25em] uppercase text-ink-soft">
            Studio
          </p>
          <h1 className="font-display text-4xl">Motion lab</h1>
          <p className="text-ink-soft">
            Paw geometry and bear states live here until the rest of the app
            wires them in.
          </p>
          <p className="flex gap-4 text-sm">
            <span className="text-ink">Motion</span>
            <Link
              href="/lab/pour"
              className="underline decoration-honey underline-offset-4"
            >
              Pour
            </Link>
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">Paw</h2>
          <div className="grid grid-cols-3 gap-4">
            <figure className="rounded-2xl bg-ink p-4 text-paper">
              <PawMark className="w-full" />
              <figcaption className="mt-2 text-center text-xs">Mark</figcaption>
            </figure>
            <figure className="rounded-2xl border border-ink/10 p-4">
              <PawPrint scanUrl={scanUrl} className="w-full text-ink" />
              <figcaption className="mt-2 text-center text-xs">Print</figcaption>
            </figure>
            <figure className="rounded-2xl border border-ink/10 p-4">
              <PawProgress
                className="w-full"
                filledToes={Math.min(filledToes, 4)}
                padFilled={padFilled}
              />
              <figcaption className="mt-2 text-center text-xs">
                Progress
              </figcaption>
            </figure>
          </div>
          <label className="block text-sm text-ink-soft">
            Lead-path fill
            <input
              type="range"
              min={0}
              max={5}
              value={filledToes}
              onChange={(event) => setFilledToes(Number(event.target.value))}
              className="mt-2 w-full accent-honey"
            />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">Bear</h2>
          <div
            className={`flex justify-center rounded-3xl py-8 ${tone === "onDark" ? "bg-ink" : "bg-paper-deep"}`}
          >
            <BearGuide key={bearState} state={bearState} tone={tone} size="lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {BEAR_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setBearState(state)}
                className={`rounded-full px-3 py-1 text-sm ${bearState === state ? "bg-ink text-paper" : "border border-ink/15"}`}
              >
                {state}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTone((value) => (value === "onDark" ? "onPaper" : "onDark"))}
            className="text-sm underline decoration-honey underline-offset-4"
          >
            Tone: {tone}
          </button>
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

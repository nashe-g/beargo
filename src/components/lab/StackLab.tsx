"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StackPlayfield } from "@/components/lab/stack/StackPlayfield";
import { StackCarryPlay, StackRound } from "@/components/lab/stack/StackRound";
import {
  useStackCoach,
  type StackCoachKind,
} from "@/components/lab/stack/useStackCoach";
import { useStackTilt } from "@/components/lab/stack/useStackTilt";
import "./stack/stack.css";
import {
  STACK_GLASS_COUNTS,
  chicagoStackDate,
  seedStackRound,
} from "@/lib/stack";

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="scanner-stage overflow-hidden rounded-[1.8rem] px-5 py-8">
      {children}
    </div>
  );
}

function IsolateStudio() {
  const [session, setSession] = useState(0);
  return (
    <IsolatePlay
      key={session}
      coachKind={session === 0 ? "full" : "countdown"}
      onReset={() => setSession((value) => value + 1)}
    />
  );
}

function IsolatePlay({
  coachKind,
  onReset,
}: {
  coachKind: StackCoachKind;
  onReset: () => void;
}) {
  const [glasses, setGlasses] = useState(3);
  const coach = useStackCoach(coachKind);
  const tilt = useStackTilt(glasses, [], false);

  useEffect(() => {
    if (!coach.playing) return;
    tilt.reset({ kick: true });
    tilt.start();
    return () => tilt.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.playing, glasses]);

  return (
    <div className="space-y-4">
      <Stage>
        <p
          className={`text-center font-display text-paper ${coach.counting ? "text-5xl" : "text-xl"}`}
        >
          {tilt.toppled
            ? "Down. Reset and try the same count."
            : coach.playing
              ? "Tap the arrow on the side it’s falling."
              : coach.headline}
        </p>
        <div className="mt-4">
          <StackPlayfield
            glasses={glasses}
            theta={coach.playing ? tilt.theta : coach.demoTheta}
            slide={coach.playing ? tilt.slide : coach.demoSlide}
            toppled={coach.playing && tilt.toppled}
            hintSide={coach.playing ? tilt.hintSide : coach.hintSide}
            pressedSide={coach.playing ? 0 : coach.tapSide}
            disabled={!coach.playing}
            onPress={(side) => {
              if (coach.playing) tilt.press(side);
            }}
            onRelease={() => {
              if (coach.playing) tilt.release();
            }}
          />
        </div>
      </Stage>
      <div className="flex flex-wrap gap-2">
        {STACK_GLASS_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => setGlasses(count)}
            className={`rounded-full px-3 py-1 text-sm ${glasses === count ? "bg-ink text-paper" : "border border-ink/15"}`}
          >
            {count} high
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-sm underline decoration-honey underline-offset-4"
      >
        Reset stack
      </button>
    </div>
  );
}

export function StackLab() {
  const [dayOffset, setDayOffset] = useState(0);
  const [replay, setReplay] = useState(0);
  const [carryReplay, setCarryReplay] = useState(0);
  const date = chicagoStackDate(dayOffset);
  const seed = useMemo(() => seedStackRound(date), [date]);
  const firstCarry = seed.carries[0];

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-md space-y-12 px-6 py-10">
        <header className="space-y-2">
          <p className="font-condensed tracking-[0.25em] uppercase text-ink-soft">
            Studio
          </p>
          <h1 className="font-display text-4xl">Wobbly Stack</h1>
          <p className="text-ink-soft">
            Tap the arrow on the side it’s falling. Live play is untouched.
          </p>
          <p className="flex gap-4 text-sm">
            <Link
              href="/lab"
              className="underline decoration-honey underline-offset-4"
            >
              Motion
            </Link>
            <Link
              href="/lab/pour"
              className="underline decoration-honey underline-offset-4"
            >
              Pour
            </Link>
            <span className="text-ink">Stack</span>
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            01 Lean
          </h2>
          <p className="text-sm text-ink-soft">
            It plays itself three times. Then 3-2-1. Same tap when you play.
          </p>
          <IsolateStudio />
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            02 One carry
          </h2>
          <p className="text-sm text-ink-soft">
            Watch once, then carry. A bump you can see coming.
          </p>
          {firstCarry ? (
            <div className="scanner-stage overflow-hidden rounded-[1.8rem] text-paper">
              <div className="flex min-h-[34rem] flex-col px-5 py-6">
                <StackCarryPlay
                  key={`${date}-carry-${carryReplay}`}
                  carry={firstCarry}
                  coach={carryReplay === 0 ? "full" : "countdown"}
                  label="CARRY 01"
                  doneLabel="Again"
                  onDone={() => setCarryReplay((value) => value + 1)}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            03 Round
          </h2>
          <p className="text-sm text-ink-soft">
            Three silent tilts. Then three, four, five.
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
          <StackRound
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


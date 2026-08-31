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
  STACK_LAB_SHIFTS,
  chicagoStackDate,
  seedStackRound,
  type StackModifier,
} from "@/lib/stack";

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="scanner-stage overflow-hidden rounded-[1.8rem] px-5 py-8">
      {children}
    </div>
  );
}

function IsolateStudio({ modifier }: { modifier: string }) {
  const [session, setSession] = useState(0);
  return (
    <IsolatePlay
      key={`${modifier}-${session}`}
      modifier={modifier}
      coachKind={session === 0 ? "full" : "countdown"}
      onReset={() => setSession((value) => value + 1)}
    />
  );
}

function IsolatePlay({
  coachKind,
  modifier,
  onReset,
}: {
  coachKind: StackCoachKind;
  modifier: string;
  onReset: () => void;
}) {
  const [glasses, setGlasses] = useState(3);
  const coach = useStackCoach(coachKind);
  const tilt = useStackTilt(glasses, [], false, modifier);

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
            elapsed={coach.playing ? tilt.elapsed : 0}
            walking={coach.playing && !tilt.toppled}
            modifier={modifier}
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

function shiftBlurb(modifier: StackModifier) {
  if (modifier === "HAPPY HOUR")
    return "Bodies streak past. They clip the tray from the side.";
  if (modifier === "FRIDAY NIGHT")
    return "You’re in the pit. Shoulders, not an aisle.";
  if (modifier === "CLOSING TIME")
    return "Empty. One bulb. The last drunk weaves the whole floor.";
  if (modifier === "WEDDING PARTY")
    return "Champagne down the runner. The receiving line will not part.";
  return "Quiet well. One person, then the tray.";
}

export function StackLab() {
  const [shift, setShift] = useState<StackModifier>("REGULAR SHIFT");
  const [replay, setReplay] = useState(0);
  const [carryReplay, setCarryReplay] = useState(0);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("shift");
    if (value && STACK_LAB_SHIFTS.includes(value as StackModifier)) {
      setShift(value as StackModifier);
    }
  }, []);
  const date = chicagoStackDate();
  const seed = useMemo(
    () => seedStackRound(date, "lab", shift),
    [date, shift],
  );
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
            Tap the side they’re falling. Pick a shift — the room changes
            before you play. Live venues stay on tonight’s seed.
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

        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STACK_LAB_SHIFTS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setShift(name);
                  setReplay((value) => value + 1);
                  setCarryReplay((value) => value + 1);
                }}
                className={`rounded-full px-3 py-1 text-sm ${shift === name ? "bg-ink text-paper" : "border border-ink/15"}`}
              >
                {name}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft">{shiftBlurb(shift)}</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            01 Lean
          </h2>
          <p className="text-sm text-ink-soft">
            It plays itself three times. Then 3-2-1. Same tap when you play.
          </p>
          <IsolateStudio modifier={shift} />
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
                  key={`${shift}-carry-${carryReplay}`}
                  carry={firstCarry}
                  coach={carryReplay === 0 ? "full" : "countdown"}
                  label="CARRY 01"
                  doneLabel="Again"
                  modifier={shift}
                  onDone={() => setCarryReplay((value) => value + 1)}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-condensed tracking-[0.2em] uppercase">
            03 Tonight’s shift
          </h2>
          <p className="text-sm text-ink-soft">
            Same tap. This is tonight’s course.
          </p>
          <p className="text-xs text-ink-soft">
            {seed.carries
              .map(
                (carry, index) =>
                  `${index + 1}: ${(carry.durationMs / 1000).toFixed(1)}s · ${carry.jolts.length} bump${carry.jolts.length === 1 ? "" : "s"}`,
              )
              .join(" · ")}
          </p>
          <StackRound
            key={`${shift}-${replay}`}
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


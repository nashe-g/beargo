"use client";

import { useEffect, useState } from "react";

export type StackCoachKind = "full" | "countdown";
export type StackCoachPhase = "demo" | "count" | "go" | "play";

const DEMO_SIDES = [1, -1, 1] as const;
const LEAN_MS = 720;
const HOLD_MS = 200;
const TAP_MS = 300;
const SETTLE_MS = 480;
const PEAK = 0.22;
const STEP_MS = LEAN_MS + HOLD_MS + TAP_MS + SETTLE_MS;

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function useStackCoach(kind: StackCoachKind) {
  const [phase, setPhase] = useState<StackCoachPhase>(
    kind === "full" ? "demo" : "count",
  );
  const [demoTheta, setDemoTheta] = useState(0);
  const [hintSide, setHintSide] = useState<-1 | 0 | 1>(0);
  const [tapSide, setTapSide] = useState<-1 | 0 | 1>(0);
  const [count, setCount] = useState(3);
  const [line, setLine] = useState(
    kind === "full" ? "Don’t tap yet." : "Get ready.",
  );

  useEffect(() => {
    if (phase !== "demo") return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const index = Math.min(
        DEMO_SIDES.length - 1,
        Math.floor(elapsed / STEP_MS),
      );
      const local = elapsed - index * STEP_MS;
      const side = DEMO_SIDES[index] ?? 1;
      const falling = side < 0 ? "left" : "right";

      if (elapsed >= DEMO_SIDES.length * STEP_MS) {
        setDemoTheta(0);
        setHintSide(0);
        setTapSide(0);
        setPhase("count");
        return;
      }

      if (local < LEAN_MS) {
        const t = easeOut(local / LEAN_MS);
        setDemoTheta(side * PEAK * t);
        setHintSide(side);
        setTapSide(0);
        setLine(`Falling ${falling}.`);
      } else if (local < LEAN_MS + HOLD_MS) {
        setDemoTheta(side * PEAK);
        setHintSide(side);
        setTapSide(0);
        setLine(`Tap ${falling}.`);
      } else if (local < LEAN_MS + HOLD_MS + TAP_MS) {
        const t = easeInOut((local - LEAN_MS - HOLD_MS) / TAP_MS);
        setDemoTheta(side * PEAK * (1 - t));
        setHintSide(side);
        setTapSide(side);
        setLine("Tap.");
      } else {
        setDemoTheta(0);
        setHintSide(0);
        setTapSide(0);
        setLine("Caught.");
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "count") return;
    setCount(3);
    setLine("Get ready.");
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        setPhase("go");
        return;
      }
      setCount(n);
    }, 720);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "go") return;
    const id = window.setTimeout(() => setPhase("play"), 520);
    return () => window.clearTimeout(id);
  }, [phase]);

  const playing = phase === "play";
  const counting = phase === "count" || phase === "go";
  const headline = playing
    ? ""
    : phase === "count"
      ? String(count)
      : phase === "go"
        ? "Go."
        : line;

  return {
    phase,
    playing,
    counting,
    headline,
    hintSide,
    tapSide,
    demoTheta,
    demoSlide: tapSide === 0 ? 0 : tapSide * 0.35,
  };
}

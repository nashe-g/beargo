"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  STACK,
  STACK_REST,
  nextNudgeAt,
  stackHintSide,
  stackKick,
  stackLength,
  tapCatch,
  stackSlide,
  stackTopple,
  stepStack,
  type StackBody,
  type StackJolt,
} from "@/lib/stack";
import { clinkSound } from "@/lib/stack-sound";

export function useStackTilt(
  glasses: number,
  jolts: StackJolt[],
  locked: boolean,
) {
  const [theta, setTheta] = useState(0);
  const [slide, setSlide] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [maxLean, setMaxLean] = useState(0);
  const [integral, setIntegral] = useState(0);
  const [toppled, setToppled] = useState(false);
  const [incoming, setIncoming] = useState<StackJolt | null>(null);
  const [running, setRunning] = useState(false);
  const [holding, setHolding] = useState(false);
  const [taps, setTaps] = useState(0);
  const [hintSide, setHintSide] = useState<-1 | 0 | 1>(0);
  const bodyRef = useRef<StackBody>(STACK_REST);
  const forceRef = useRef(0);
  const assistRef = useRef(0);
  const phaseRef = useRef(0);
  const elapsedRef = useRef(0);
  const maxRef = useRef(0);
  const integralRef = useRef(0);
  const accRef = useRef(0);
  const nudgeAtRef = useRef(nextNudgeAt(800, Math.random, glasses));
  const firedRef = useRef(new Set<number>());
  const glassesRef = useRef(glasses);
  const joltsRef = useRef(jolts);
  const lockedRef = useRef(locked);
  const hintRef = useRef<-1 | 0 | 1>(0);
  const runningRef = useRef(false);
  const frameRef = useRef(0);
  const lastRef = useRef(0);
  const tapsRef = useRef(0);
  const lastPressAtRef = useRef(0);

  glassesRef.current = glasses;
  joltsRef.current = jolts;
  lockedRef.current = locked;

  const publish = useCallback((body: StackBody) => {
    setTheta(body.theta);
    setSlide(stackSlide(body.x));
    const nextHint = stackHintSide(body.theta, hintRef.current);
    hintRef.current = nextHint;
    setHintSide(nextHint);
  }, []);

  const stopLoop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    runningRef.current = false;
    setRunning(false);
  }, []);

  const loop = useCallback(
    (now: number) => {
      if (lockedRef.current) {
        stopLoop();
        return;
      }
      const last = lastRef.current || now;
      accRef.current += Math.min(0.05, (now - last) / 1000);
      lastRef.current = now;
      let steps = 0;
      while (accRef.current >= STACK.dt && steps < 5) {
        accRef.current -= STACK.dt;
        steps += 1;
        elapsedRef.current += STACK.dt * 1000;
        phaseRef.current += STACK.dt;
        const phase = phaseRef.current;
        const disturb =
          (STACK.wander / stackLength(glassesRef.current)) *
          (Math.sin(phase * 2.05) + 0.35 * Math.sin(phase * 3.3 + 0.9));
        for (const jolt of joltsRef.current) {
          if (
            !firedRef.current.has(jolt.atMs) &&
            elapsedRef.current >= jolt.atMs
          ) {
            firedRef.current.add(jolt.atMs);
            bodyRef.current = {
              ...bodyRef.current,
              v: bodyRef.current.v + jolt.side * STACK.joltV,
            };
          }
        }
        if (elapsedRef.current >= nudgeAtRef.current) {
          const side = Math.random() < 0.5 ? -1 : 1;
          bodyRef.current = {
            ...bodyRef.current,
            v: bodyRef.current.v + side * STACK.nudge,
          };
          nudgeAtRef.current = nextNudgeAt(
            elapsedRef.current,
            Math.random,
            glassesRef.current,
          );
        }
        assistRef.current *= Math.exp(-STACK.tapDecay * STACK.dt);
        if (Math.abs(assistRef.current) < 0.04) assistRef.current = 0;
        const next = stepStack(
          bodyRef.current,
          glassesRef.current,
          forceRef.current + assistRef.current,
          STACK.dt,
          disturb,
        );
        bodyRef.current = next;
        maxRef.current = Math.max(maxRef.current, Math.abs(next.theta));
        integralRef.current += Math.abs(next.theta) * STACK.dt;
        if (Math.abs(next.theta) >= stackTopple(glassesRef.current)) {
          publish(next);
          setElapsed(elapsedRef.current);
          setMaxLean(maxRef.current);
          setIntegral(integralRef.current);
          setToppled(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(40);
          }
          stopLoop();
          return;
        }
      }
      let nextIncoming: StackJolt | null = null;
      for (const jolt of joltsRef.current) {
        const until = jolt.atMs - elapsedRef.current;
        if (until > 0 && until <= STACK.telegraphMs) {
          nextIncoming = jolt;
          break;
        }
      }
      setIncoming(nextIncoming);
      publish(bodyRef.current);
      setElapsed(elapsedRef.current);
      setMaxLean(maxRef.current);
      setIntegral(integralRef.current);
      frameRef.current = requestAnimationFrame(loop);
    },
    [publish, stopLoop],
  );

  const start = useCallback(() => {
    if (lockedRef.current || runningRef.current) return;
    runningRef.current = true;
    lastRef.current = 0;
    accRef.current = 0;
    setRunning(true);
    frameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const press = useCallback((side: -1 | 1) => {
    if (lockedRef.current) return;
    const now = performance.now();
    const sinceLast = now - lastPressAtRef.current;
    lastPressAtRef.current = now;
    tapsRef.current += 1;
    setTaps(tapsRef.current);
    bodyRef.current = tapCatch(bodyRef.current, side, glassesRef.current);
    // Panic-tapping is never optimal: taps inside 180ms of each other
    // partially undo the catch and whip the tray harder.
    if (sinceLast < 180) {
      bodyRef.current = {
        ...bodyRef.current,
        omega: bodyRef.current.omega + side * 0.16,
        v: bodyRef.current.v * 1.12,
      };
    }
    assistRef.current = side * STACK.tapForce;
    forceRef.current = side * STACK.holdForce;
    setHolding(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
    clinkSound();
    publish(bodyRef.current);
  }, [publish]);

  const release = useCallback(() => {
    forceRef.current = 0;
    setHolding(false);
  }, []);

  const reset = useCallback((options?: { kick?: boolean }) => {
    stopLoop();
    const next = options?.kick === false ? STACK_REST : stackKick();
    bodyRef.current = next;
    forceRef.current = 0;
    assistRef.current = 0;
    phaseRef.current = 0;
    elapsedRef.current = 0;
    maxRef.current = Math.abs(next.theta);
    integralRef.current = 0;
    accRef.current = 0;
    nudgeAtRef.current = nextNudgeAt(700, Math.random, glassesRef.current);
    firedRef.current = new Set();
    tapsRef.current = 0;
    lastPressAtRef.current = 0;
    setTaps(0);
    setElapsed(0);
    setMaxLean(Math.abs(next.theta));
    setIntegral(0);
    setToppled(false);
    setIncoming(null);
    setHolding(false);
    hintRef.current = stackHintSide(next.theta, 0);
    publish(next);
  }, [publish, stopLoop]);

  useEffect(() => {
    if (locked) stopLoop();
  }, [locked, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    theta,
    slide,
    elapsed,
    maxLean,
    integral,
    toppled,
    incoming,
    running,
    holding,
    taps,
    hintSide,
    start,
    press,
    release,
    reset,
    stop: stopLoop,
  };
}


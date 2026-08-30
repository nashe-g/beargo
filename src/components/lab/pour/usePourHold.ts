"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FOAM_HEAD,
  POUR_FILL_CAP,
  POUR_STREAM,
  foamTopY,
  glassWidth,
  type VesselSpec,
} from "@/lib/pour";

function addBeer(
  spec: VesselSpec,
  fill: number,
  foam: number,
  dt: number,
  fromTap: boolean,
) {
  const width = glassWidth(spec, fill);
  const rate =
    POUR_STREAM.volumePerSecond * (fromTap ? 1 : POUR_STREAM.landFactor);
  const nextFill = Math.min(POUR_FILL_CAP, fill + (rate / width) * dt);
  const nextFoam =
    fromTap && nextFill > 0.03
      ? Math.min(FOAM_HEAD.max, foam + FOAM_HEAD.buildPerSecond * dt)
      : foam;
  return { fill: nextFill, foam: nextFoam };
}

export function usePourHold(locked: boolean, spec: VesselSpec) {
  const [fill, setFill] = useState(0);
  const [foam, setFoam] = useState(0);
  const [holding, setHolding] = useState(false);
  const [landing, setLanding] = useState(false);
  const [settling, setSettling] = useState(false);
  const [streamCut, setStreamCut] = useState(0);
  const fillRef = useRef(0);
  const foamRef = useRef(0);
  const holdingRef = useRef(false);
  const specRef = useRef(spec);
  const frameRef = useRef(0);
  const lastRef = useRef(0);
  const landUntilRef = useRef(0);
  const landStartRef = useRef(0);
  const landMsRef = useRef(160);
  const settleUntilRef = useRef(0);
  const doneRef = useRef<((value: number) => void) | null>(null);
  const lockedRef = useRef(locked);

  specRef.current = spec;
  lockedRef.current = locked;

  const stopLoop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  const publish = useCallback(() => {
    setFill(fillRef.current);
    setFoam(foamRef.current);
  }, []);

  const drainFoam = useCallback((dt: number) => {
    const excess = Math.max(0, foamRef.current - FOAM_HEAD.rest);
    if (excess <= 0) return;
    const drain = excess * (1 - Math.exp(-FOAM_HEAD.drainK * dt));
    foamRef.current = Math.max(FOAM_HEAD.rest, foamRef.current - drain);
    fillRef.current = Math.min(
      POUR_FILL_CAP,
      fillRef.current + drain * FOAM_HEAD.wetFraction,
    );
  }, []);

  const finishSettle = useCallback(() => {
    settleUntilRef.current = 0;
    setSettling(false);
    const excess = Math.max(0, foamRef.current - FOAM_HEAD.rest);
    foamRef.current = Math.min(foamRef.current, FOAM_HEAD.rest);
    fillRef.current = Math.min(
      POUR_FILL_CAP,
      fillRef.current + excess * FOAM_HEAD.wetFraction,
    );
    publish();
    const done = doneRef.current;
    doneRef.current = null;
    done?.(fillRef.current);
  }, [publish]);

  const beginSettle = useCallback(() => {
    landUntilRef.current = 0;
    setLanding(false);
    setStreamCut(1);
    if (foamRef.current <= FOAM_HEAD.rest + 0.004) {
      finishSettle();
      return;
    }
    settleUntilRef.current = performance.now() + FOAM_HEAD.settleMs;
    setSettling(true);
  }, [finishSettle]);

  const loop = useCallback(
    (now: number) => {
      const last = lastRef.current || now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastRef.current = now;
      const landingNow = landUntilRef.current > now;
      const settlingNow = settleUntilRef.current > now;

      if (holdingRef.current || landingNow) {
        const next = addBeer(
          specRef.current,
          fillRef.current,
          foamRef.current,
          dt,
          holdingRef.current,
        );
        fillRef.current = next.fill;
        foamRef.current = next.foam;
        if (landingNow) {
          const cut = Math.min(
            1,
            (now - landStartRef.current) / landMsRef.current,
          );
          setStreamCut(cut);
        }
        publish();
      } else if (settlingNow) {
        drainFoam(dt);
        publish();
      }

      if (holdingRef.current || landingNow || settlingNow) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      if (landUntilRef.current) {
        beginSettle();
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      if (settleUntilRef.current) {
        finishSettle();
      }
    },
    [beginSettle, drainFoam, finishSettle, publish],
  );

  const start = useCallback(() => {
    if (
      lockedRef.current ||
      holdingRef.current ||
      landUntilRef.current ||
      settleUntilRef.current
    ) {
      return;
    }
    holdingRef.current = true;
    setHolding(true);
    setStreamCut(0);
    lastRef.current = 0;
    stopLoop();
    frameRef.current = requestAnimationFrame(loop);
  }, [loop, stopLoop]);

  const finish = useCallback(() => {
    return new Promise<number>((resolve) => {
      holdingRef.current = false;
      setHolding(false);
      if (landUntilRef.current || settleUntilRef.current) {
        doneRef.current = resolve;
        return;
      }
      const impact = foamTopY(
        specRef.current,
        fillRef.current,
        foamRef.current,
      );
      const fallMs = Math.max(
        90,
        (impact - POUR_STREAM.tapY) / POUR_STREAM.pxPerMs,
      );
      doneRef.current = resolve;
      landStartRef.current = performance.now();
      landMsRef.current = fallMs;
      landUntilRef.current = landStartRef.current + fallMs;
      setLanding(true);
      lastRef.current = 0;
      stopLoop();
      frameRef.current = requestAnimationFrame(loop);
    });
  }, [loop, stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    fillRef.current = 0;
    foamRef.current = 0;
    holdingRef.current = false;
    landUntilRef.current = 0;
    settleUntilRef.current = 0;
    doneRef.current = null;
    setFill(0);
    setFoam(0);
    setHolding(false);
    setLanding(false);
    setSettling(false);
    setStreamCut(0);
  }, [stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    fill,
    foam,
    holding,
    landing,
    settling,
    streamCut,
    start,
    finish,
    reset,
  };
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PawMark } from "@/components/paw/PawMark";

const BEAT_COPY_MS = 780;
const HOLD_COPY_MS = 2200;
const FADE_MS = 280;

function enterKey(token: string, serviceDay: string) {
  return `beargo:enter:${token}:${serviceDay}`;
}

function alreadyEntered(token: string, serviceDay: string) {
  try {
    return localStorage.getItem(enterKey(token, serviceDay)) === "1";
  } catch {
    return true;
  }
}

function markEntered(token: string, serviceDay: string) {
  try {
    localStorage.setItem(enterKey(token, serviceDay), "1");
  } catch {
    /* private mode */
  }
}

function peopleLine(count: number) {
  if (count <= 0) return null;
  if (count === 1) return "1 person tonight";
  return `${count} people tonight`;
}

export function ScanEnter({
  pawToken,
  serviceDay,
  venue,
  peopleHere,
  handle,
  onDone,
}: {
  pawToken: string;
  serviceDay: string;
  venue: string;
  peopleHere: number;
  handle: string | null;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"check" | "stamp" | "copy" | "out">(
    "check",
  );
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    markEntered(pawToken, serviceDay);
    setPhase("out");
    window.setTimeout(() => onDoneRef.current(), FADE_MS);
  }, [pawToken, serviceDay]);

  useLayoutEffect(() => {
    if (alreadyEntered(pawToken, serviceDay)) {
      done.current = true;
      onDoneRef.current();
      return;
    }
    setPhase("stamp");
  }, [pawToken, serviceDay]);

  useEffect(() => {
    if (phase !== "stamp") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => setPhase("copy"),
      reduce ? 120 : BEAT_COPY_MS,
    );
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "copy") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(finish, reduce ? 900 : HOLD_COPY_MS);
    return () => window.clearTimeout(id);
  }, [finish, phase]);

  if (phase === "check") {
    return <div className="scan-enter is-check" aria-hidden />;
  }

  const people = peopleLine(peopleHere);

  return (
    <button
      type="button"
      className={`scan-enter${phase === "out" ? " is-out" : ""}`}
      onClick={finish}
      aria-label="You’re in. Tap to skip."
    >
      <span className="scan-enter-mark">
        <span className="scan-enter-ripple" aria-hidden />
        <PawMark className="scan-enter-paw" title="BearGo" />
      </span>
      <span
        className={`scan-enter-copy${phase === "copy" || phase === "out" ? " is-on" : ""}`}
      >
        <span className="scan-enter-in">You’re in.</span>
        <span className="scan-enter-place">
          {venue.toUpperCase()}
          {people ? ` · ${people}` : ""}
        </span>
        {handle ? (
          <span className="scan-enter-handle">
            Tonight you’re <em>{handle}</em>
          </span>
        ) : null}
      </span>
      <span className="scan-enter-skip">Tap to skip</span>
    </button>
  );
}

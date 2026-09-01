"use client";

import { useEffect, useState } from "react";

export type StackCoachPhase = "count" | "go" | "play";

export function useStackCoach() {
  const [phase, setPhase] = useState<StackCoachPhase>("count");
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (phase !== "count") return;
    setCount(3);
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
  const headline = playing ? "" : phase === "count" ? String(count) : "Go.";

  return {
    phase,
    playing,
    counting,
    headline,
  };
}

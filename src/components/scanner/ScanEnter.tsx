"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PawMark } from "@/components/paw/PawMark";

const BEAT_COPY_MS = 780;
const HOLD_COPY_MS = 2000;
const FADE_MS = 280;
const INTRO_KEY = "beargo:intro";

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

function seenIntro() {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return true;
  }
}

function markIntro() {
  try {
    localStorage.setItem(INTRO_KEY, "1");
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
  const [phase, setPhase] = useState<"check" | "stamp" | "intro" | "copy" | "out">(
    "check",
  );
  const [page, setPage] = useState(0);
  const [teach, setTeach] = useState(false);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    markEntered(pawToken, serviceDay);
    markIntro();
    setPhase("out");
    window.setTimeout(() => onDoneRef.current(), FADE_MS);
  }, [pawToken, serviceDay]);

  useLayoutEffect(() => {
    const intro = seenIntro();
    if (alreadyEntered(pawToken, serviceDay) && intro) {
      done.current = true;
      onDoneRef.current();
      return;
    }
    setTeach(!intro);
    setPhase("stamp");
  }, [pawToken, serviceDay]);

  useEffect(() => {
    if (phase !== "stamp") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => setPhase(teach ? "intro" : "copy"),
      reduce ? 120 : BEAT_COPY_MS,
    );
    return () => window.clearTimeout(id);
  }, [phase, teach]);

  useEffect(() => {
    if (phase !== "copy") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(finish, reduce ? 900 : HOLD_COPY_MS);
    return () => window.clearTimeout(id);
  }, [finish, phase]);

  if (phase === "check") {
    return <div className="scan-enter is-check" aria-hidden />;
  }

  if (phase === "intro" || (phase === "out" && teach)) {
    return (
      <div className={`scan-enter scan-intro${phase === "out" ? " is-out" : ""}`}>
        <ScanIntroPages
          venue={venue}
          handle={handle}
          page={page}
          onPage={setPage}
          onEnter={finish}
        />
      </div>
    );
  }

  const people = peopleLine(peopleHere);

  return (
    <button
      type="button"
      className={`scan-enter${phase === "out" ? " is-out" : ""}`}
      onClick={() => {
        if (teach) setPhase("intro");
        else finish();
      }}
      aria-label={teach ? "Continue" : "You’re in. Tap to skip."}
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
      <span className="scan-enter-skip">{teach ? "" : "Tap to skip"}</span>
    </button>
  );
}

function ScanIntroPages({
  venue,
  handle,
  page,
  onPage,
  onEnter,
}: {
  venue: string;
  handle: string | null;
  page: number;
  onPage: (page: number) => void;
  onEnter: () => void;
}) {
  const last = page === 2;
  return (
    <div className="scan-intro-stage">
      <div className="scan-intro-dots" aria-hidden>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`scan-intro-dot${index === page ? " is-on" : ""}`}
          />
        ))}
      </div>

      <div key={page} className="scan-intro-page">
        {page === 0 ? <IntroWall venue={venue} /> : null}
        {page === 1 ? <IntroHouse /> : null}
        {page === 2 ? <IntroYou handle={handle} /> : null}
      </div>

      <div className="scan-intro-actions">
        {last ? (
          <button type="button" className="scan-intro-cta" onClick={onEnter}>
            Enter the room
          </button>
        ) : (
          <button
            type="button"
            className="scan-intro-cta"
            onClick={() => onPage(page + 1)}
          >
            Next
          </button>
        )}
        <button type="button" className="scan-intro-skip" onClick={onEnter}>
          Skip
        </button>
      </div>
    </div>
  );
}

function IntroWall({ venue }: { venue: string }) {
  return (
    <>
      <p className="scan-intro-kicker">{venue}</p>
      <h1 className="scan-intro-title">The wall for tonight.</h1>
      <p className="scan-intro-body">This thread is the room. Read it. Talk in it.</p>
      <div className="scan-intro-card" aria-hidden>
        <p className="scan-intro-card-handle">The House</p>
        <p className="scan-intro-card-body">Tonight starts here.</p>
      </div>
    </>
  );
}

function IntroHouse() {
  return (
    <>
      <p className="scan-intro-kicker">The House</p>
      <h1 className="scan-intro-title">It talks first.</h1>
      <p className="scan-intro-body">
        Dares land in the thread. Carry a tray. Three questions. Play from the post.
      </p>
      <div className="scan-intro-dare" aria-hidden>
        <p className="scan-intro-dare-kicker">Tray</p>
        <p className="scan-intro-dare-title">
          Make the least coordinated person at your table play this.
        </p>
        <span className="scan-intro-dare-btn">Take it</span>
      </div>
    </>
  );
}

function IntroYou({ handle }: { handle: string | null }) {
  return (
    <>
      <p className="scan-intro-kicker">Tonight</p>
      <h1 className="scan-intro-title">
        {handle ? (
          <>
            You’re <em>{handle}</em>.
          </>
        ) : (
          "You’re in."
        )}
      </h1>
      <p className="scan-intro-body">
        Show someone at the table. Hand them the phone.
      </p>
    </>
  );
}

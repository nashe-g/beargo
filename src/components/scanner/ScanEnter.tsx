"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PawMark } from "@/components/paw/PawMark";
import { PawProgress } from "@/components/paw/PawProgress";

const BEAT_COPY_MS = 780;
const HOLD_COPY_MS = 2000;
const FADE_MS = 320;
const INTRO_KEY = "beargo:intro:a5";
const INTRO_PAGES = 4;

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
      <div
        className={`scan-enter scan-intro is-bleed${phase === "out" ? " is-out" : ""}`}
        data-page={page}
      >
        <ScanIntroPages
          venue={venue}
          handle={handle}
          peopleHere={peopleHere}
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
  peopleHere,
  page,
  onPage,
  onEnter,
}: {
  venue: string;
  handle: string | null;
  peopleHere: number;
  page: number;
  onPage: (page: number) => void;
  onEnter: () => void;
}) {
  const last = page === INTRO_PAGES - 1;
  const startX = useRef<number | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const delta = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 56) return;
    if (delta < 0 && !last) onPage(page + 1);
    if (delta > 0 && page > 0) onPage(page - 1);
  }

  return (
    <div
      className="scan-intro-stage"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <header className="scan-intro-top">
        <PawProgress
          className="h-8 w-8 text-honey"
          filledToes={page + 1}
          padFilled={last}
        />
        <p className="scan-intro-venue">{venue}</p>
        <button type="button" className="scan-intro-skip" onClick={onEnter}>
          Skip
        </button>
      </header>

      <div key={page} className={`scan-intro-page is-${page}`}>
        {page === 0 ? <IntroRoom peopleHere={peopleHere} /> : null}
        {page === 1 ? <IntroTalk /> : null}
        {page === 2 ? <IntroHouse /> : null}
        {page === 3 ? <IntroName handle={handle} /> : null}
      </div>

      <div className="scan-intro-actions">
        {last ? (
          <button type="button" className="scan-intro-cta" onClick={onEnter}>
            Enter the room
          </button>
        ) : (
          <button
            type="button"
            className="scan-intro-next"
            onClick={() => onPage(page + 1)}
          >
            Next
            <span aria-hidden> →</span>
          </button>
        )}
      </div>
    </div>
  );
}

function IntroRoom({ peopleHere }: { peopleHere: number }) {
  return (
    <>
      <p className="scan-intro-kicker">Tonight</p>
      <h1 className="scan-intro-display">
        You’re in
        <span>the room.</span>
      </h1>
      <p className="scan-intro-lead">
        This is the live feed for everyone here tonight.
      </p>
      <p className="scan-intro-body">
        See what people are saying, join in, or just watch.
      </p>
      <div className="scan-intro-stamps">
        <span className="scan-intro-stamp">Only people here can get in.</span>
        {peopleHere > 0 ? (
          <span className="scan-intro-live">
            <span className="hub-live-dot" aria-hidden />
            {peopleHere} here
          </span>
        ) : null}
      </div>
    </>
  );
}

function IntroTalk() {
  return (
    <>
      <h1 className="scan-intro-display is-tight">
        Say what everyone’s thinking.
      </h1>
      <div className="scan-intro-chips" aria-hidden>
        <span>this song though</span>
        <span>one more?</span>
        <span>where next</span>
      </div>
      <p className="scan-intro-body">
        React to the music. Ask a question. Start a debate. Share a joke.
      </p>
      <p className="scan-intro-rule">
        It’s a conversation with the room you’re already in.
        <span>No followers. No permanent profile.</span>
      </p>
    </>
  );
}

function IntroHouse() {
  return (
    <>
      <h1 className="scan-intro-display is-house">
        The House
        <span>talks too.</span>
      </h1>
      <p className="scan-intro-body is-narrow">
        Sometimes it drops a quick game into the room — keep a wobbly tray
        steady on your phone, or take a three-question trivia challenge.
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

function IntroName({ handle }: { handle: string | null }) {
  return (
    <div className="scan-intro-name">
      <p className="scan-intro-kicker">Tonight you’re</p>
      <h1 className="scan-intro-handle">{handle || "in."}</h1>
      <p className="scan-intro-body">That’s your name in here. Not a profile.</p>
    </div>
  );
}

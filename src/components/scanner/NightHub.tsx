"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { NightView } from "@/lib/feed-types";
import type { PawRecord } from "@/lib/paws";
import { playPath, resultPath, type PlayKind } from "@/lib/play-kind";
import { keepFromParam } from "@/lib/play-source";
import { formatWobble } from "@/lib/stack";

export type HubPlayed = {
  kind: PlayKind;
  rank: number;
  playerCount: number;
  stackWobble: number;
  correctCount: number;
} | null;

function roomHref(token: string, from?: string | null) {
  return `/p/${token}/room${keepFromParam(from)}`;
}

function peopleHook(count: number) {
  if (count <= 0) return "Nobody’s talking. Start it.";
  if (count === 1) return "One other person already scanned.";
  return `${count} people in this room right now.`;
}

function hotPulse(label: string) {
  return label === "Moving" || label === "Busy" || label === "Packed";
}

export function NightHub({
  paw,
  from,
  peopleHere,
  pulse,
  stack,
  trivia,
}: {
  paw: PawRecord;
  from?: string | null;
  peopleHere: number;
  pulse: NightView;
  stack: HubPlayed;
  trivia: HubPlayed;
}) {
  const [here, setHere] = useState(peopleHere);
  const [night, setNight] = useState<NightView>(pulse);

  const refreshNight = useCallback(() => {
    void fetch(`/api/p/${encodeURIComponent(paw.token)}/night`)
      .then((response) => (response.ok ? response.json() : null))
      .then((next: NightView | null) => {
        if (!next) return;
        setHere(next.peopleHere);
        setNight(next);
      })
      .catch(() => undefined);
  }, [paw.token]);

  const trayHref = stack
    ? resultPath(paw.token, "stack")
    : playPath(paw.token, "stack");
  const triviaHref = trivia
    ? resultPath(paw.token, "trivia")
    : playPath(paw.token, "trivia");
  const talkHref = roomHref(paw.token, from);

  const primary: "stack" | "trivia" | "room" = !stack
    ? "stack"
    : !trivia
      ? "trivia"
      : "room";

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="scanned"
        from={from}
        onStamped={refreshNight}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 pt-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-condensed text-sm tracking-[0.2em] text-honey uppercase">
              {paw.hostDisplayName}
            </p>
            {hotPulse(night.label) ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-honey/35 bg-honey/10 px-2.5 py-1 font-condensed text-xs tracking-[0.16em] text-honey uppercase">
                <span className="hub-live-dot" aria-hidden />
                {night.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 font-condensed text-xs tracking-[0.16em] text-paper/45 uppercase">
                <span className="hub-live-dot" aria-hidden />
                Live
              </span>
            )}
          </div>
          <h1 className="mt-5 font-display text-[2.35rem] leading-[0.95] tracking-tight sm:text-5xl">
            Don’t just sit there.
          </h1>
          <p className="mt-3 max-w-[20rem] text-base leading-snug text-paper/70">
            The table is watching. Pick a dare.
          </p>
        </header>

        <div className="mt-6 flex min-h-0 flex-1 flex-col justify-end gap-3 pb-1">
          {primary === "stack" ? (
            <PrimaryDare
              href={trayHref}
              kicker="Test your table"
              title="Don’t drop the drinks."
              dare="Hand this to whoever’s least coordinated."
              cta="Carry the tray"
            />
          ) : null}
          {primary === "trivia" ? (
            <PrimaryDare
              href={triviaHref}
              kicker="Beat the room"
              title="Same three questions as everyone."
              dare="Winner stays on the board tonight."
              cta="Ask me"
            />
          ) : null}
          {primary === "room" ? (
            <PrimaryDare
              href={talkHref}
              kicker="Talk to the room"
              title="The night isn’t over."
              dare={peopleHook(here)}
              cta="Open the room"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            {primary !== "room" ? (
              <SideDare
                href={talkHref}
                label="Talk"
                line={here > 0 ? peopleHook(here) : "Patio. Line. Playlist."}
              />
            ) : (
              <SideDare
                href={trayHref}
                label="Tray"
                line={
                  stack
                    ? `#${stack.rank} · wobble ${formatWobble(stack.stackWobble)}`
                    : "Don’t drop the drinks."
                }
              />
            )}
            {primary !== "trivia" ? (
              <SideDare
                href={triviaHref}
                label="Trivia"
                line={
                  trivia
                    ? `#${trivia.rank} · ${trivia.correctCount} of 3`
                    : "3 questions. Same for everyone."
                }
              />
            ) : (
              <SideDare
                href={trayHref}
                label="Tray"
                line={
                  stack
                    ? `#${stack.rank} · wobble ${formatWobble(stack.stackWobble)}`
                    : "Don’t drop the drinks."
                }
              />
            )}
          </div>
        </div>
      </div>
    </ScannerShell>
  );
}

function PrimaryDare({
  href,
  kicker,
  title,
  dare,
  cta,
}: {
  href: string;
  kicker: string;
  title: string;
  dare: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="hub-primary block rounded-[1.85rem] bg-honey px-5 py-6 text-ink active:scale-[0.99]"
    >
      <p className="font-condensed text-xs tracking-[0.22em] text-honey-ink uppercase">
        {kicker}
      </p>
      <p className="mt-2 font-display text-[1.85rem] leading-[1.02] tracking-tight">
        {title}
      </p>
      <p className="mt-2 text-sm leading-snug text-ink/70">{dare}</p>
      <span className="mt-5 flex h-12 items-center justify-center rounded-full bg-ink text-base font-semibold tracking-[0.12em] text-paper">
        {cta}
      </span>
    </Link>
  );
}

function SideDare({
  href,
  label,
  line,
}: {
  href: string;
  label: string;
  line: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[6.5rem] flex-col justify-between rounded-[1.35rem] border border-paper/18 bg-paper/6 px-3.5 py-3.5 text-left active:bg-paper/10"
    >
      <p className="font-condensed text-xs tracking-[0.18em] text-honey uppercase">
        {label}
      </p>
      <p className="font-display text-lg leading-tight text-paper/90">{line}</p>
    </Link>
  );
}

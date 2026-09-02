"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { NightView } from "@/lib/feed-types";
import { pulseLine } from "@/lib/feed-pulse";
import type { PawRecord } from "@/lib/paws";
import { playPath, resultPath, type PlayKind } from "@/lib/play-kind";
import { formatWobble } from "@/lib/stack";

export type HubPlayed = {
  kind: PlayKind;
  rank: number;
  playerCount: number;
  stackWobble: number;
  correctCount: number;
} | null;

function roomHref(token: string, from?: string | null) {
  return from === "share" ? `/p/${token}/room?from=share` : `/p/${token}/room`;
}

function peopleLine(count: number) {
  if (count <= 0) return "Be the first voice tonight.";
  if (count === 1) return "1 person here tonight";
  return `${count} people here tonight`;
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

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="scanned"
        from={from}
        onStamped={refreshNight}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 pt-2 text-center">
          <p className="font-condensed text-sm tracking-[0.22em] text-honey uppercase">
            {paw.hostDisplayName}
          </p>
          <p className="mt-2 font-condensed text-sm tracking-[0.14em] text-paper/55">
            {pulseLine(night)}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            What are you here for?
          </h1>
        </header>

        <div className="mt-8 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
          <HubDoor
            href={roomHref(paw.token, from)}
            kicker="Talk to the room"
            title={peopleLine(here)}
            body={
              night.nearbyCount
                ? `${night.nearbyCount} note${night.nearbyCount === 1 ? "" : "s"} from nearby.`
                : "Everyone here scanned the Paw."
            }
          />
          <HubDoor
            href={
              stack
                ? resultPath(paw.token, "stack")
                : playPath(paw.token, "stack")
            }
            kicker="Test your table"
            title={
              stack
                ? `#${stack.rank} of ${stack.playerCount} · wobble ${formatWobble(stack.stackWobble)}`
                : "Give this to the least coordinated person at your table."
            }
            body={stack ? "See your wobble rank." : "Keep the glasses up."}
          />
          <HubDoor
            href={
              trivia
                ? resultPath(paw.token, "trivia")
                : playPath(paw.token, "trivia")
            }
            kicker="Beat the room"
            title={
              trivia
                ? `#${trivia.rank} of ${trivia.playerCount} · ${trivia.correctCount} of 3`
                : "3 curious questions. Same for everyone today."
            }
            body={trivia ? "See your trivia rank." : "One board in this bar."}
          />
        </div>
      </div>
    </ScannerShell>
  );
}

function HubDoor({
  href,
  kicker,
  title,
  body,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[1.6rem] border border-paper/12 bg-paper/6 px-5 py-5 text-left active:bg-paper/10"
    >
      <p className="font-condensed text-xs tracking-[0.2em] text-honey uppercase">
        {kicker}
      </p>
      <p className="mt-2 font-display text-2xl leading-tight">{title}</p>
      <p className="mt-2 text-sm text-paper/60">{body}</p>
    </Link>
  );
}

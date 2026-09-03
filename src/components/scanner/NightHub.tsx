"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ScanEnter } from "@/components/scanner/ScanEnter";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession, type StampResult } from "@/components/scanner/StampSession";
import { PawMark } from "@/components/paw/PawMark";
import type {
  NearbyVenueView,
  NightCrown,
  NightView,
  OverheardPost,
} from "@/lib/feed-types";
import { formatMilesShort } from "@/lib/geo";
import { hubDensity } from "@/lib/hub-density";
import type { PawRecord } from "@/lib/paws";
import { playPath, resultPath, type PlayKind } from "@/lib/play-kind";
import { keepFromParam } from "@/lib/play-source";
import { formatWobble } from "@/lib/stack";
import { timeAgo } from "@/lib/feed-time";

export type HubPlayed = {
  kind: PlayKind;
  rank: number;
  playerCount: number;
  stackWobble: number;
  correctCount: number;
} | null;

type Primary = "stack" | "trivia" | "room";

type Links = {
  tray: string;
  trivia: string;
  talk: string;
};

function roomHref(token: string, from?: string | null) {
  return `/p/${token}/room${keepFromParam(from)}`;
}

export function NightHub({
  paw,
  from,
  serviceDay,
  handle: initialHandle,
  peopleHere,
  pulse,
  stack,
  trivia,
}: {
  paw: PawRecord;
  from?: string | null;
  serviceDay: string;
  handle: string | null;
  peopleHere: number;
  pulse: NightView;
  stack: HubPlayed;
  trivia: HubPlayed;
}) {
  const [here, setHere] = useState(peopleHere);
  const [night, setNight] = useState<NightView>(pulse);
  const [handle, setHandle] = useState(initialHandle);
  const [entering, setEntering] = useState(true);
  const [now, setNow] = useState(() => Date.now());

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

  const onStamped = useCallback(
    (result: StampResult) => {
      if (result.handle) setHandle(result.handle);
      refreshNight();
    },
    [refreshNight],
  );

  const dismissEnter = useCallback(() => setEntering(false), []);
  const density = hubDensity(here, night.postsTonight);
  const live = density === "moving" || density === "packed";

  useEffect(() => {
    if (entering) return;
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    const poll = window.setInterval(refreshNight, live ? 12_000 : 20_000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [entering, live, refreshNight]);

  const links: Links = {
    tray: stack ? resultPath(paw.token, "stack") : playPath(paw.token, "stack"),
    trivia: trivia
      ? resultPath(paw.token, "trivia")
      : playPath(paw.token, "trivia"),
    talk: roomHref(paw.token, from),
  };
  const primary: Primary = !stack ? "stack" : !trivia ? "trivia" : "room";
  const posts = night.overheard ?? [];
  const trayCrown = night.trayCrown ?? null;
  const triviaCrown = night.triviaCrown ?? null;
  const nearby = night.nearbyVenues ?? [];

  return (
    <ScannerShell showMark={!entering}>
      <StampSession
        pawToken={paw.token}
        event="scanned"
        from={from}
        onStamped={onStamped}
      />
      {entering ? (
        <ScanEnter
          pawToken={paw.token}
          serviceDay={serviceDay}
          venue={paw.hostDisplayName}
          peopleHere={here}
          handle={handle}
          onDone={dismissEnter}
        />
      ) : null}
      <div
        className="hub-night flex min-h-0 flex-1 flex-col"
        data-density={density}
        aria-hidden={entering}
        {...(entering ? { inert: true } : {})}
      >
        {density === "dead" ? (
          <DeadRoom
            venue={paw.hostDisplayName}
            href={links.talk}
            nearby={nearby}
          />
        ) : null}
        {density === "quiet" ? (
          <QuietRoom
            venue={paw.hostDisplayName}
            posts={posts.slice(0, 2)}
            now={now}
            handle={handle}
            here={here}
            tray={trayCrown}
            triviaLead={triviaCrown}
            primary={primary}
            links={links}
            stack={stack}
            trivia={trivia}
            nearby={nearby}
          />
        ) : null}
        {density === "moving" ? (
          <MovingRoom
            venue={paw.hostDisplayName}
            label={night.label}
            here={here}
            posts={posts.slice(0, 2)}
            now={now}
            handle={handle}
            tray={trayCrown}
            triviaLead={triviaCrown}
            links={links}
            stack={stack}
            trivia={trivia}
            nearby={nearby}
          />
        ) : null}
        {density === "packed" ? (
          <PackedRoom
            venue={paw.hostDisplayName}
            here={here}
            posts={posts}
            now={now}
            tray={trayCrown}
            triviaLead={triviaCrown}
            links={links}
            stack={stack}
            trivia={trivia}
            nearby={nearby}
          />
        ) : null}
      </div>
    </ScannerShell>
  );
}

function DeadRoom({
  venue,
  href,
  nearby,
}: {
  venue: string;
  href: string;
  nearby: NearbyVenueView[];
}) {
  return (
    <>
      <p className="pt-1 font-condensed text-sm tracking-[0.2em] text-honey uppercase">
        {venue}
      </p>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-tight sm:text-5xl">
          You’re first.
        </h1>
        <p className="mt-3 max-w-[18rem] text-base leading-snug text-paper/70">
          The room starts with you.
        </p>
      </div>
      <NightNearby venues={nearby} />
      <Link
        href={href}
        className="hub-primary mb-1 mt-3 block rounded-[1.65rem] bg-honey px-5 py-5 text-ink active:scale-[0.99]"
      >
        <p className="font-condensed text-xs tracking-[0.22em] text-honey-ink uppercase">
          Founder
        </p>
        <p className="mt-1.5 font-display text-[1.65rem] leading-[1.05] tracking-tight">
          Say the first thing.
        </p>
        <span className="mt-4 flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold tracking-[0.12em] text-paper">
          Start the room
        </span>
      </Link>
    </>
  );
}

function QuietRoom({
  venue,
  posts,
  now,
  handle,
  here,
  tray,
  triviaLead,
  primary,
  links,
  stack,
  trivia,
  nearby,
}: {
  venue: string;
  posts: OverheardPost[];
  now: number;
  handle: string | null;
  here: number;
  tray: NightCrown | null;
  triviaLead: NightCrown | null;
  primary: Primary;
  links: Links;
  stack: HubPlayed;
  trivia: HubPlayed;
  nearby: NearbyVenueView[];
}) {
  const dare = primaryDare(primary, {
    handle,
    tray,
    trivia: triviaLead,
    here,
    links,
  });
  return (
    <>
      <HubHeader venue={venue} />
      {posts.length > 0 ? (
        <Overheard posts={posts} href={links.talk} now={now} size="quiet" />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
      <Crown tray={tray} trivia={triviaLead} />
      <div className="mt-4 flex shrink-0 flex-col gap-2.5 pb-1">
        <PrimaryDare {...dare} />
        <GameChips
          skip={primary}
          links={links}
          stack={stack}
          trivia={trivia}
          tray={tray}
          triviaLead={triviaLead}
          here={here}
        />
        <NightNearby venues={nearby} />
      </div>
    </>
  );
}

function MovingRoom({
  venue,
  label,
  here,
  posts,
  now,
  handle,
  tray,
  triviaLead,
  links,
  stack,
  trivia,
  nearby,
}: {
  venue: string;
  label: string;
  here: number;
  posts: OverheardPost[];
  now: number;
  handle: string | null;
  tray: NightCrown | null;
  triviaLead: NightCrown | null;
  links: Links;
  stack: HubPlayed;
  trivia: HubPlayed;
  nearby: NearbyVenueView[];
}) {
  return (
    <>
      <HubHeader venue={venue} here={here} pulse={label} />
      {posts.length > 0 ? (
        <Overheard posts={posts} href={links.talk} now={now} size="moving" />
      ) : (
        <Link
          href={links.talk}
          className="mt-6 block min-h-0 flex-1 rounded-[1.5rem] px-1 py-4"
        >
          <p className="font-display text-[2rem] leading-tight">
            {here} people in the room.
          </p>
          <p className="mt-2 text-paper/55">Nobody’s talking yet. Open it.</p>
        </Link>
      )}
      <Crown tray={tray} trivia={triviaLead} compact />
      <div className="mt-3 flex shrink-0 gap-2 pb-1">
        <SideChip
          href={links.tray}
          label="Tray"
          line={chipTray(stack, tray, handle)}
        />
        <SideChip
          href={links.trivia}
          label="Trivia"
          line={chipTrivia(trivia, triviaLead)}
        />
      </div>
      <NightNearby venues={nearby} />
    </>
  );
}

function PackedRoom({
  venue,
  here,
  posts,
  now,
  tray,
  triviaLead,
  links,
  stack,
  trivia,
  nearby,
}: {
  venue: string;
  here: number;
  posts: OverheardPost[];
  now: number;
  tray: NightCrown | null;
  triviaLead: NightCrown | null;
  links: Links;
  stack: HubPlayed;
  trivia: HubPlayed;
  nearby: NearbyVenueView[];
}) {
  const loop = posts.length >= 4 ? [...posts, ...posts] : posts;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="hub-reacts" aria-hidden>
        <span className="hub-mote" />
        <span className="hub-mote" />
        <span className="hub-mote" />
        <span className="hub-mote" />
        <span className="hub-mote" />
      </div>
      <HubHeader venue={venue} here={here} pulse="Packed" />
      <BoardRace tray={tray} trivia={triviaLead} />
      {posts.length > 0 ? (
        <Link
          href={links.talk}
          className={`hub-marquee mt-3 min-h-0 flex-1${posts.length >= 4 ? " is-rolling" : ""}`}
        >
          <span className="hub-marquee-track">
            {loop.map((post, index) => (
              <span
                key={`${post.id}-${index}`}
                className="hub-overheard-post hub-marquee-item"
              >
                <span className="block font-display text-[1.2rem] leading-snug text-paper">
                  <span className="text-honey">{post.handle}</span>
                  <span className="text-paper/50">: </span>
                  {post.body}
                </span>
                <span className="mt-1.5 flex items-center gap-2 font-condensed text-[0.68rem] tracking-[0.16em] text-paper/40 uppercase">
                  {timeAgo(post.createdAt, now)}
                  {post.upvotes > 0 ? (
                    <span className="text-honey">↑ {post.upvotes}</span>
                  ) : null}
                </span>
              </span>
            ))}
          </span>
        </Link>
      ) : (
        <Link href={links.talk} className="mt-4 block min-h-0 flex-1">
          <p className="font-display text-[2.4rem] leading-[0.95]">
            {here} here.
          </p>
          <p className="mt-3 text-paper/60">The room is the night. Open it.</p>
        </Link>
      )}
      <div className="relative z-[1] mt-3 flex shrink-0 gap-2 pb-1">
        <SideChip
          href={links.tray}
          label="Tray"
          line={chipTray(stack, tray, null)}
        />
        <SideChip
          href={links.trivia}
          label="Trivia"
          line={chipTrivia(trivia, triviaLead)}
        />
      </div>
      <NightNearby venues={nearby} compact />
    </div>
  );
}

function NightNearby({
  venues,
  compact = false,
}: {
  venues: NearbyVenueView[];
  compact?: boolean;
}) {
  if (venues.length === 0) return null;
  return (
    <section
      className={`hub-near relative z-[1] shrink-0${compact ? " is-compact" : ""}`}
    >
      <p className="font-condensed text-[0.68rem] tracking-[0.2em] text-paper/40 uppercase">
        The night nearby
      </p>
      <div className="hub-near-row">
        {venues.map((place) =>
          place.pawToken ? (
            <Link
              key={place.hostId}
              href={`/p/${encodeURIComponent(place.pawToken)}?from=nearby`}
              className="hub-near-item"
            >
              <PawMark
                className={`hub-near-paw is-${place.label.toLowerCase()}`}
                title={place.venue}
              />
              <span className="hub-near-name">{place.venue}</span>
              <span className="hub-near-meta">
                {formatMilesShort(place.miles)} · {place.label.toLowerCase()}
              </span>
            </Link>
          ) : null,
        )}
      </div>
    </section>
  );
}

function HubHeader({
  venue,
  here,
  pulse,
}: {
  venue: string;
  here?: number;
  pulse?: string;
}) {
  return (
    <header className="shrink-0 pt-1">
      <div className="flex items-center justify-between gap-3">
        <p className="font-condensed text-sm tracking-[0.2em] text-honey uppercase">
          {venue}
        </p>
        {here != null ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/35 bg-honey/10 px-2.5 py-1 font-condensed text-xs tracking-[0.16em] text-honey uppercase">
            <span className="hub-live-dot" aria-hidden />
            {here} here
            {pulse ? ` · ${pulse}` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 font-condensed text-xs tracking-[0.16em] text-paper/45 uppercase">
            <span className="hub-live-dot" aria-hidden />
            Live
          </span>
        )}
      </div>
    </header>
  );
}

function BoardRace({
  tray,
  trivia,
}: {
  tray: NightCrown | null;
  trivia: NightCrown | null;
}) {
  if (!tray && !trivia) return null;
  return (
    <p className="hub-race mt-3 shrink-0 font-display text-[1.05rem] leading-snug text-paper/90">
      {tray ? (
        <span>
          {tray.handle}
          <span className="text-paper/45">
            {" "}
            tray
            {tray.wobble != null ? ` ${formatWobble(tray.wobble)}` : ""}
          </span>
        </span>
      ) : null}
      {tray && trivia ? <span className="text-honey/70"> · </span> : null}
      {trivia ? (
        <span>
          {trivia.handle}
          <span className="text-paper/45"> trivia {trivia.correctCount}/3</span>
        </span>
      ) : null}
    </p>
  );
}

function Overheard({
  posts,
  href,
  now,
  size,
}: {
  posts: OverheardPost[];
  href: string;
  now: number;
  size: "quiet" | "moving";
}) {
  const moving = size === "moving";
  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="font-condensed text-[0.68rem] tracking-[0.2em] text-paper/40 uppercase">
        Overheard
      </p>
      <div className="mt-2.5 flex min-h-0 flex-1 flex-col justify-center gap-2">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={href}
            className={`hub-overheard-post block rounded-[1.35rem] border border-paper/14 bg-paper/7 px-4 py-3.5 text-left active:bg-paper/12${index === 0 ? " is-fresh" : ""}`}
          >
            <p
              className={`font-display leading-snug text-paper${moving ? " text-[1.35rem]" : " text-[1.15rem]"}`}
            >
              <span className="text-honey">{post.handle}</span>
              <span className="text-paper/50">: </span>
              {post.body}
            </p>
            <p className="mt-1.5 flex items-center gap-2 font-condensed text-[0.68rem] tracking-[0.16em] text-paper/40 uppercase">
              {index === 0 ? <span className="hub-live-dot" aria-hidden /> : null}
              {timeAgo(post.createdAt, now)}
              {post.upvotes > 0 ? (
                <span className="text-honey">↑ {post.upvotes}</span>
              ) : null}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Crown({
  tray,
  trivia,
  compact = false,
}: {
  tray: NightCrown | null;
  trivia: NightCrown | null;
  compact?: boolean;
}) {
  if (!tray && !trivia) return null;
  const cls = compact
    ? "mt-2 shrink-0 truncate font-display text-sm leading-snug text-paper/80"
    : "font-display text-[1.05rem] leading-snug text-paper/90";
  return (
    <div className={compact ? "mt-2 shrink-0" : "mt-3 shrink-0 space-y-1"}>
      {tray ? (
        <p className={cls}>
          {tray.handle} holds the tray
          {tray.wobble != null ? (
            <span className="text-paper/50">
              {" "}
              · wobble {formatWobble(tray.wobble)}
            </span>
          ) : null}
        </p>
      ) : null}
      {trivia && !compact ? (
        <p className={cls}>
          {trivia.handle} leads trivia
          <span className="text-paper/50"> · {trivia.correctCount} of 3</span>
        </p>
      ) : null}
      {trivia && compact && !tray ? (
        <p className={cls}>
          {trivia.handle} leads trivia · {trivia.correctCount} of 3
        </p>
      ) : null}
    </div>
  );
}

function GameChips({
  skip,
  links,
  stack,
  trivia,
  tray,
  triviaLead,
  here,
}: {
  skip: Primary;
  links: Links;
  stack: HubPlayed;
  trivia: HubPlayed;
  tray: NightCrown | null;
  triviaLead: NightCrown | null;
  here: number;
}) {
  const talk = {
    href: links.talk,
    label: "Talk",
    line: here > 1 ? `${here} here` : "The room",
  };
  const trayChip = {
    href: links.tray,
    label: "Tray",
    line: chipTray(stack, tray, null),
  };
  const triviaChip = {
    href: links.trivia,
    label: "Trivia",
    line: chipTrivia(trivia, triviaLead),
  };
  const pair =
    skip === "stack"
      ? [talk, triviaChip]
      : skip === "trivia"
        ? [talk, trayChip]
        : [trayChip, triviaChip];
  return (
    <div className="grid grid-cols-2 gap-2">
      {pair.map((chip) => (
        <SideChip key={chip.label} {...chip} />
      ))}
    </div>
  );
}

function chipTray(
  stack: HubPlayed,
  tray: NightCrown | null,
  handle: string | null,
) {
  if (stack) return `#${stack.rank} · ${formatWobble(stack.stackWobble)}`;
  if (handle && tray && handle === tray.handle) return "Yours";
  if (tray) return tray.handle;
  return "Carry it";
}

function chipTrivia(trivia: HubPlayed, lead: NightCrown | null) {
  if (trivia) return `#${trivia.rank} · ${trivia.correctCount} of 3`;
  if (lead) return lead.handle;
  return "3 questions";
}

function primaryDare(
  primary: Primary,
  input: {
    handle: string | null;
    tray: NightCrown | null;
    trivia: NightCrown | null;
    here: number;
    links: Links;
  },
) {
  if (primary === "stack") {
    const mine = input.handle && input.tray && input.handle === input.tray.handle;
    if (mine) {
      return {
        href: input.links.tray,
        kicker: "Tray",
        title: "You’re holding the tray.",
        line:
          input.tray?.wobble != null
            ? `wobble ${formatWobble(input.tray.wobble)}`
            : "Don’t drop it.",
        cta: "Carry it again",
      };
    }
    if (input.tray) {
      return {
        href: input.links.tray,
        kicker: "Tray",
        title: `Take the tray from ${input.tray.handle}`,
        line:
          input.tray.wobble != null
            ? `wobble ${formatWobble(input.tray.wobble)}`
            : "Don’t drop the drinks.",
        cta: "Take it",
      };
    }
    return {
      href: input.links.tray,
      kicker: "Tray",
      title: "Carry the tray.",
      line: "Don’t drop the drinks.",
      cta: "Take it",
    };
  }
  if (primary === "trivia") {
    const mine =
      input.handle && input.trivia && input.handle === input.trivia.handle;
    if (mine) {
      return {
        href: input.links.trivia,
        kicker: "Trivia",
        title: "You’re leading trivia.",
        line: `${input.trivia?.correctCount ?? 0} of 3 tonight`,
        cta: "Ask me again",
      };
    }
    if (input.trivia) {
      return {
        href: input.links.trivia,
        kicker: "Trivia",
        title: `Take trivia from ${input.trivia.handle}`,
        line: `${input.trivia.correctCount} of 3 tonight`,
        cta: "Ask me",
      };
    }
    return {
      href: input.links.trivia,
      kicker: "Trivia",
      title: "Same three questions as everyone.",
      line: "Winner stays on the board tonight.",
      cta: "Ask me",
    };
  }
  return {
    href: input.links.talk,
    kicker: "Room",
    title: "The room is open.",
    line: `${input.here} people in here right now.`,
    cta: "Talk",
  };
}

function PrimaryDare({
  href,
  kicker,
  title,
  line,
  cta,
}: {
  href: string;
  kicker: string;
  title: string;
  line: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="hub-primary block rounded-[1.65rem] bg-honey px-5 py-5 text-ink active:scale-[0.99]"
    >
      <p className="font-condensed text-xs tracking-[0.22em] text-honey-ink uppercase">
        {kicker}
      </p>
      <p className="mt-1.5 font-display text-[1.65rem] leading-[1.05] tracking-tight">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-ink/65">{line}</p>
      <span className="mt-4 flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold tracking-[0.12em] text-paper">
        {cta}
      </span>
    </Link>
  );
}

function SideChip({
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
      className="flex min-h-[3.35rem] min-w-0 flex-1 items-center justify-between gap-2 rounded-full border border-paper/18 bg-paper/6 px-3.5 py-2 text-left active:bg-paper/10"
    >
      <p className="font-condensed text-[0.68rem] tracking-[0.16em] text-honey uppercase">
        {label}
      </p>
      <p className="truncate font-display text-sm leading-none text-paper/80">
        {line}
      </p>
    </Link>
  );
}

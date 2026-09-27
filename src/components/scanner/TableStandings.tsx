"use client";

import { useEffect, useState } from "react";
import type { NightTableView } from "@/lib/night-table-types";
import { jumpedCopy, playingTonightLine } from "@/lib/table-night";
import { formatSeconds } from "@/lib/table-test";
import { formatWobble } from "@/lib/stack";

function deviceHint() {
  try {
    let id = localStorage.getItem("beargo:device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("beargo:device", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function TableStandings({
  pawToken,
  table,
  onTable,
  onOpenChat,
}: {
  pawToken: string;
  table: NightTableView;
  onTable: (table: NightTableView) => void;
  onOpenChat?: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scoreBeat, setScoreBeat] = useState<"score" | "tray">("score");
  const [nightBeat, setNightBeat] = useState<"result" | "chat" | "rules">("result");
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [scoreLit, setScoreLit] = useState(false);
  const [alias, setAlias] = useState("");

  useEffect(() => {
    setScoreBeat("score");
    setNightBeat("result");
    setOpenPerson(null);
    setScoreLit(false);
  }, [table.id, table.status]);

  const wantsAlias =
    Boolean(table.night) && (nightBeat === "chat" || nightBeat === "rules");
  useEffect(() => {
    if (!wantsAlias || alias) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/p/${encodeURIComponent(pawToken)}/room`,
        );
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { handle?: string };
        if (!cancelled && payload.handle) setAlias(payload.handle);
      } catch {
        // The chat can still open. The name shows once the room loads.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alias, pawToken, wantsAlias]);

  async function post(path: string, extra: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(pawToken)}/tables/${encodeURIComponent(table.joinCode)}${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceHint: deviceHint(), ...extra }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t.");
        setBusy(false);
        return;
      }
      onTable(payload);
    } catch {
      setError("Couldn’t.");
    }
    setBusy(false);
  }

  const night = table.night;
  if (night && nightBeat === "rules") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h1 className="font-display text-3xl leading-tight">Three rules.</h1>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-paper/80">
            <li>No phone numbers, emails, or other ways to contact someone.</li>
            <li>No threats.</li>
            <li>Nothing sexual involving anyone under 18.</li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-paper/60">
            Posts that break these are blocked.
          </p>
        </div>
        <div className="shrink-0 space-y-2 pt-3">
          <button
            type="button"
            disabled={!alias}
            onClick={() => onOpenChat?.()}
            className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
          >
            Open the chat
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
            onClick={() => setNightBeat("chat")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (night && nightBeat === "chat") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <h1 className="font-display text-3xl leading-tight">
            Live chat. Here. Tonight.
          </h1>
          <p className="mt-4 font-display text-2xl leading-tight text-honey">
            Your real name stays off the chat.
          </p>
          <p className="mt-6 text-xs tracking-[0.16em] text-paper/45 uppercase">
            Your name tonight
          </p>
          <p className="mt-2 font-display text-4xl leading-tight text-paper">
            {alias || "…"}
          </p>
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
        <div className="shrink-0 space-y-2 pt-3">
          <button
            type="button"
            disabled={!alias}
            onClick={() => setNightBeat("rules")}
            className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
          >
            The rules
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
            onClick={() => setNightBeat("result")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (night) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm tracking-[0.18em] text-honey uppercase">{table.name}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">
          #{night.rank}
          <span className="ml-2 font-sans text-lg font-normal text-paper/55">
            of {night.tableCount}
          </span>
        </h1>
        <p className="mt-2 text-lg text-honey">{jumpedCopy(night.jumped)}</p>
        {night.jumped !== 0 ? (
          <p className="mt-1 text-sm text-paper/45">Was #{night.rank + night.jumped}</p>
        ) : null}
        <p className="mt-1 text-sm text-paper/75">
          {night.skipped
            ? "Skipped the tray."
            : `Steadiness ${formatWobble(night.wobble)}. Lower is better.`}
        </p>
        <p className="mt-1 text-sm text-paper/55">{playingTonightLine(night.tableCount)}</p>
        <p className="mt-6 text-xs tracking-[0.16em] text-paper/45 uppercase">
          Steadiness · lower is better
        </p>
        <ol className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {night.rows.map((row) => (
            <li
              key={row.name}
              className={`flex items-baseline justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                row.mine ? "bg-honey/15 text-honey" : "text-paper/80"
              }`}
            >
              <span className="tabular-nums text-paper/45">#{row.rank}</span>
              <span className="min-w-0 flex-1 truncate">{row.name}</span>
              <span className="tabular-nums text-paper/55">
                {row.skipped ? "skip" : formatWobble(row.wobble)}
              </span>
            </li>
          ))}
        </ol>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
        <button
          type="button"
          onClick={() => setNightBeat("chat")}
          className="btn-honey mt-4 flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
        >
          Next
        </button>
      </div>
    );
  }

  const reveal = table.reveal;
  const board = table.board;
  const scoreLine = reveal
    ? `${formatSeconds(reveal.averageMs)} average answer time. Faster is better. A wrong answer counts as 20 sec.`
    : "";

  if (scoreBeat === "tray") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h1 className="font-display text-3xl leading-tight">
            Next game. One person carries a tray of glasses on their phone.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-paper/75">
            The glasses tip. They tap to steady them. Steadier is better, and
            it can move {table.name} up or down tonight.
          </p>
          <p className="mt-4 text-sm text-paper/80">Pick who plays.</p>
          <div className="mt-5 space-y-2">
            {table.members.map((member) => (
              <button
                key={member.nickname}
                type="button"
                disabled={busy}
                onClick={() =>
                  void post("/tray", {
                    mode: "champion",
                    champion: member.nickname,
                  })
                }
                className="flex h-12 w-full items-center justify-center rounded-full border border-paper/20 text-base disabled:opacity-40"
              >
                {member.nickname}
                {member.mine ? " · you" : ""}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
        <div className="shrink-0 pt-3">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
            onClick={() => setScoreBeat("score")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {reveal ? (
        <>
          <button
            type="button"
            onClick={() => setScoreLit((open) => !open)}
            className={`rounded-2xl px-1 py-1 text-left ${scoreLit ? "bg-honey/10" : ""}`}
            aria-expanded={scoreLit}
          >
            <h1 className="font-display text-3xl leading-tight">
              {table.name} got {reveal.correctCount} of {reveal.asked}.
            </h1>
            <p
              className={`mt-3 text-sm leading-relaxed ${scoreLit ? "text-honey" : "text-paper/80"}`}
            >
              {scoreLine}
            </p>
          </button>
          <p className="mt-3 px-1 text-sm text-honey">
            #{reveal.rank} of the tables here tonight
          </p>
          <ul className="mt-4 space-y-2">
            {reveal.people.map((person) => {
              const open = openPerson === person.nickname;
              return (
                <li key={person.nickname}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPerson((current) =>
                        current === person.nickname ? null : person.nickname,
                      )
                    }
                    className="flex w-full items-baseline justify-between gap-3 text-left text-sm"
                    aria-expanded={open}
                  >
                    <span className={person.mine ? "text-honey" : "text-paper/85"}>
                      {person.nickname}
                      {person.mine ? " · you" : ""}
                      {person.carried ? " · best at the table" : ""}
                    </span>
                    <span className="tabular-nums text-paper/55">
                      {person.correctCount}/{person.asked} ·{" "}
                      {formatSeconds(person.averageMs)}
                    </span>
                  </button>
                  {open ? (
                    <p className="mt-1 text-sm leading-relaxed text-paper/70">
                      {person.nickname}: {person.correctCount} of {person.asked} in{" "}
                      {formatSeconds(person.averageMs)}.
                      {person.carried
                        ? " Best at the table — most right, then fastest."
                        : ""}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {board && board.rows.length > 0 ? (
        <ol className="mt-6 min-h-0 flex-1 space-y-2 overflow-y-auto">
          <p className="text-xs tracking-[0.16em] text-paper/45 uppercase">
            {playingTonightLine(board.tableCount)}
          </p>
          {board.rows.map((row) => (
            <li
              key={row.name}
              className={`flex items-baseline justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                row.mine ? "bg-honey/15 text-honey" : "text-paper/80"
              }`}
            >
              <span className="tabular-nums text-paper/45">#{row.rank}</span>
              <span className="min-w-0 flex-1 truncate">{row.name}</span>
              <span className="tabular-nums text-paper/55">
                {row.correctCount}/{row.asked}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex-1" />
      )}

      {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
      <button
        type="button"
        onClick={() => setScoreBeat("tray")}
        className="btn-honey mt-4 flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
      >
        Next
      </button>
    </div>
  );
}

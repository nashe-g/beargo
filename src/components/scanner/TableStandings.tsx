"use client";

import { useState } from "react";
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
}: {
  pawToken: string;
  table: NightTableView;
  onTable: (table: NightTableView) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

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
  if (night) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm tracking-[0.18em] text-honey uppercase">Tonight</p>
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
        <p className="mt-1 text-sm text-paper/55">
          {night.skipped
            ? "Skipped the tray"
            : `Wobble ${formatWobble(night.wobble)}`}
          {" · "}
          {playingTonightLine(night.tableCount)}
        </p>
        <ol className="mt-6 min-h-0 flex-1 space-y-2 overflow-y-auto">
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
          disabled={busy}
          onClick={() => void post("/room")}
          className="btn-honey mt-4 flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
        >
          {busy ? "…" : "The room"}
        </button>
      </div>
    );
  }

  const reveal = table.reveal;
  const board = table.board;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-sm tracking-[0.18em] text-honey uppercase">
        The Table Test
      </p>
      {reveal ? (
        <>
          <h1 className="mt-2 font-display text-3xl leading-tight">
            {reveal.correctCount}/{reveal.asked} correct
          </h1>
          <p className="mt-2 text-lg text-paper/80">
            {formatSeconds(reveal.averageMs)} average
          </p>
          <p className="mt-1 text-sm text-honey">
            #{reveal.rank} tonight
            {reveal.tableCount > 1 ? ` · ${reveal.tableCount} tables` : ""}
          </p>
          <ul className="mt-4 space-y-2">
            {reveal.people.map((person) => (
              <li
                key={person.nickname}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className={person.mine ? "text-honey" : "text-paper/85"}>
                  {person.nickname}
                  {person.mine ? " · you" : ""}
                  {person.carried ? " · carried" : ""}
                </span>
                <span className="tabular-nums text-paper/55">
                  {person.correctCount}/{person.asked} ·{" "}
                  {formatSeconds(person.averageMs)}
                </span>
              </li>
            ))}
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

      <details className="shrink-0 pt-3 text-sm text-paper/45">
        <summary className="cursor-pointer text-paper/55">How we score</summary>
        <p className="mt-2 leading-relaxed">
          You have to pick. Right is your real time. Wrong is 20.0 sec and
          doesn’t count. Tables rank by correct rate, then by the average of
          each person’s time.
        </p>
      </details>

      {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}

      {picking ? (
        <div className="shrink-0 space-y-2 pt-3">
          <p className="text-sm text-paper/65">Who’s the steadiest?</p>
          {table.members.map((member) => (
            <button
              key={member.nickname}
              type="button"
              disabled={busy}
              onClick={() =>
                void post("/tray", { mode: "champion", champion: member.nickname })
              }
              className="flex h-12 w-full items-center justify-center rounded-full border border-paper/20 text-base disabled:opacity-40"
            >
              {member.nickname}
              {member.mine ? " · you" : ""}
            </button>
          ))}
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
            onClick={() => setPicking(false)}
          >
            Back
          </button>
        </div>
      ) : (
        <div className="shrink-0 space-y-2 pt-3">
          <p className="pb-1 text-center text-sm text-paper/55">
            Send your steadiest, or everyone runs it and we average.
          </p>
          {table.members.length === 1 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void post("/tray", { mode: "everyone" })}
              className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
            >
              {busy ? "…" : "Carry the tray"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPicking(true)}
                className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
              >
                Send our steadiest
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void post("/tray", { mode: "everyone" })}
                className="flex h-12 w-full items-center justify-center rounded-full border border-paper/20 text-base disabled:opacity-40"
              >
                Everyone runs it
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void post("/tray/skip")}
            className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
          >
            Tray’s broken — skip
          </button>
        </div>
      )}
    </div>
  );
}

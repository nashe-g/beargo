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
}: {
  pawToken: string;
  table: NightTableView;
  onTable: (table: NightTableView) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [scoreBeat, setScoreBeat] = useState<"score" | "tray">("score");
  const [nightBeat, setNightBeat] = useState<"result" | "chat">("result");
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [scoreLit, setScoreLit] = useState(false);

  useEffect(() => {
    setScoreBeat("score");
    setNightBeat("result");
    setOpenPerson(null);
    setScoreLit(false);
    setPicking(false);
  }, [table.id, table.status]);

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
  if (night && nightBeat === "chat") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <h1 className="font-display text-3xl leading-tight">The bar can talk now.</h1>
          <p className="mt-3 text-sm leading-relaxed text-paper/75">
            You post as {table.name}. Say whatever you want.
          </p>
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
        <div className="shrink-0 space-y-2 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void post("/room")}
            className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
          >
            {busy ? "…" : "Open the chat"}
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
            Next, carry a tray of glasses on your phone.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-paper/75">
            Steadier is better. It can move {table.name} up or down tonight.
          </p>
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
        {picking ? (
          <div className="shrink-0 space-y-2 pt-3">
            <p className="text-sm text-paper/75">Who carries?</p>
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
                  One person carries
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void post("/tray", { mode: "everyone" })}
                  className="flex min-h-12 w-full items-center justify-center rounded-full border border-paper/20 px-4 text-center text-base leading-snug disabled:opacity-40"
                >
                  Everyone carries. We use the average.
                </button>
              </>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void post("/tray/skip")}
              className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
            >
              Skip this one
            </button>
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
              onClick={() => {
                setPicking(false);
                setScoreBeat("score");
              }}
            >
              Back
            </button>
          </div>
        )}
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

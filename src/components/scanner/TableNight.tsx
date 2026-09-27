"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { JoinQr } from "@/components/scanner/JoinQr";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import { TableStandings } from "@/components/scanner/TableStandings";
import { TableTest } from "@/components/scanner/TableTest";
import { TableTray } from "@/components/scanner/TableTray";
import { RoomFeed } from "@/components/scanner/RoomFeed";
import { TABLE_CODE_LENGTH, TABLE_NAME_MAX, TABLE_NICK_MAX } from "@/lib/config";
import type { NightTableView } from "@/lib/night-table-types";
import type { PawRecord } from "@/lib/paws";
import { tableJoinPath } from "@/lib/play-kind";

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

function withDeviceHint(path: string) {
  const hint = deviceHint();
  if (!hint) return path;
  return `${path}?deviceHint=${encodeURIComponent(hint)}`;
}

export function TableNight({
  paw,
  from,
  initialCode,
}: {
  paw: PawRecord;
  from?: string | null;
  initialCode?: string | null;
}) {
  const router = useRouter();
  const [table, setTable] = useState<NightTableView | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(initialCode ?? "");
  const [joining, setJoining] = useState(Boolean(initialCode));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [previewLocked, setPreviewLocked] = useState(false);
  const [triviaGate, setTriviaGate] = useState<"pending" | "show" | "skip">("pending");

  const token = paw.token;

  const loadMine = useCallback(async () => {
    const response = await fetch(
      withDeviceHint(`/api/p/${encodeURIComponent(token)}/tables/me`),
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { table: NightTableView | null };
    return payload.table;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mine = await loadMine();
      if (cancelled) return;
      if (mine) {
        setTable(mine);
        setLoading(false);
        return;
      }
      if (initialCode) {
        const response = await fetch(
          `/api/p/${encodeURIComponent(token)}/tables/${encodeURIComponent(initialCode)}`,
        );
        if (response.ok) {
          const preview = (await response.json()) as NightTableView;
          setName(preview.name);
          setCode(preview.joinCode);
          if (preview.status !== "open") {
            setPreviewLocked(true);
            setError("They already started.");
          }
        } else {
          const payload = (await response.json()) as { error?: string };
          setError(payload.error || "Couldn’t find that table.");
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCode, loadMine, token]);

  const joinCode = table?.joinCode;
  const tableStatus = table?.status;

  useEffect(() => {
    if (!joinCode) return;
    setJoinUrl(`${window.location.origin}${tableJoinPath(token, joinCode)}`);
    const path = tableJoinPath(token, joinCode);
    if (window.location.pathname !== path) {
      router.replace(path);
    }
  }, [joinCode, router, token]);

  useEffect(() => {
    if (!joinCode || tableStatus === "room") return;
    const poll = window.setInterval(async () => {
      const response = await fetch(
        withDeviceHint(
          `/api/p/${encodeURIComponent(token)}/tables/${encodeURIComponent(joinCode)}`,
        ),
      );
      if (!response.ok) return;
      const next = (await response.json()) as NightTableView;
      setTable((current) => {
        if (
          current?.play &&
          next.play &&
          next.play.answers.length < current.play.answers.length
        ) {
          return current;
        }
        return next;
      });
    }, 1500);
    return () => window.clearInterval(poll);
  }, [joinCode, tableStatus, token]);

  const tableId = table?.id;
  useEffect(() => {
    if (!tableId || tableStatus !== "locked") return;
    try {
      setTriviaGate(
        sessionStorage.getItem(`beargo:trivia:${tableId}`) === "1" ? "skip" : "show",
      );
    } catch {
      setTriviaGate("show");
    }
  }, [tableId, tableStatus]);

  function dismissTriviaBrief() {
    if (tableId) {
      try {
        sessionStorage.setItem(`beargo:trivia:${tableId}`, "1");
      } catch {
        // This phone can still continue. The brief just shows again next load.
      }
    }
    setTriviaGate("skip");
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/p/${encodeURIComponent(token)}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nickname,
          deviceHint: deviceHint(),
        }),
      });
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t sit the table.");
        setBusy(false);
        return;
      }
      setTable(payload);
    } catch {
      setError("Couldn’t sit the table.");
    }
    setBusy(false);
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(token)}/tables/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            nickname,
            deviceHint: deviceHint(),
          }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t join.");
        setBusy(false);
        return;
      }
      setTable(payload);
    } catch {
      setError("Couldn’t join.");
    }
    setBusy(false);
  }

  async function lock() {
    if (!table || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(token)}/tables/${encodeURIComponent(table.joinCode)}/lock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceHint: deviceHint() }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t start.");
        setBusy(false);
        return;
      }
      setTable(payload);
    } catch {
      setError("Couldn’t start.");
    }
    setBusy(false);
  }

  async function readyUp() {
    if (!table || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(token)}/tables/${encodeURIComponent(table.joinCode)}/ready`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceHint: deviceHint() }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t ready up.");
        setBusy(false);
        return;
      }
      setTable(payload);
    } catch {
      setError("Couldn’t ready up.");
    }
    setBusy(false);
  }

  async function go() {
    if (!table || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(token)}/tables/${encodeURIComponent(table.joinCode)}/go`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceHint: deviceHint() }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t GO.");
        setBusy(false);
        return;
      }
      setTable(payload);
    } catch {
      setError("Couldn’t GO.");
    }
    setBusy(false);
  }

  const peopleLine = useMemo(() => {
    if (!table) return "";
    const n = table.members.length;
    if (n === 1) return "1 here";
    return `${n} here`;
  }, [table]);
  const starterName = table?.members.find((member) => member.isCreator)?.nickname;
  const showTriviaBrief = table?.status === "locked" && triviaGate !== "skip";

  return (
    <ScannerShell>
      <StampSession pawToken={token} event="scanned" from={from} />
      {table?.status === "live" ? (
        <StampSession pawToken={token} event="game_started" />
      ) : null}
      {table?.status === "night" || table?.status === "room" ? (
        <StampSession pawToken={token} event="game_completed" />
      ) : null}
      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-sm text-paper/50">Tonight…</p>
        </div>
      ) : table ? (
        table.status === "live" ? (
          <TableTest pawToken={token} table={table} onTable={setTable} />
        ) : table.status === "tray" ? (
          <TableTray pawToken={token} table={table} onTable={setTable} />
        ) : table.status === "revealed" || table.status === "night" ? (
          <TableStandings pawToken={token} table={table} onTable={setTable} />
        ) : table.status === "room" ? (
          <RoomFeed
            paw={paw}
            from={from}
            asReward
            tableName={table.name}
            initial={{
              handle: table.name,
              canPost: true,
              peopleHere: 0,
              pulse: {
                score: 0,
                label: "",
                peopleHere: 0,
                postsTonight: 0,
              },
              posts: [],
              nearby: [],
              source: "in_bar",
            }}
          />
        ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 pb-2">
            <p className="text-sm tracking-[0.18em] text-honey uppercase">
              {paw.hostDisplayName}
            </p>
            <h1 className="mt-1 font-display text-3xl leading-tight">{table.name}</h1>
            <p className="mt-1 text-sm text-paper/55">{peopleLine}</p>
          </header>
          {table.status === "open" ? (
            <div className="min-h-0 flex-1 overflow-y-auto pt-2">
              {table.mineCreator && joinUrl ? (
                <>
                  <p className="text-sm leading-relaxed text-paper/80">
                    Friends at {table.name} scan this to join. Or type the code.
                  </p>
                  <div className="mt-3 rounded-[1.4rem] border border-paper/12 bg-paper/6 py-4">
                    <JoinQr value={joinUrl} label={`Join ${table.name}`} />
                    <p className="mt-3 text-center font-condensed text-4xl tracking-[0.32em] text-honey drop-shadow-[0_0_18px_rgba(245,196,76,0.45)]">
                      {table.joinCode}
                    </p>
                  </div>
                </>
              ) : (
                <p className="rounded-[1.4rem] border border-paper/12 bg-paper/6 px-4 py-3 text-sm text-paper/70">
                  Waiting for the table to sit down.
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {table.members.map((member) => (
                  <li
                    key={member.nickname}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className={member.mine ? "text-honey" : "text-paper/85"}>
                      {member.nickname}
                      {member.mine ? " · you" : ""}
                    </span>
                    {member.isCreator ? (
                      <span className="text-xs text-paper/40">sat the table</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : showTriviaBrief ? (
            <div className="min-h-0 flex-1 overflow-y-auto pt-3">
              <p className="font-display text-3xl leading-tight">
                Trivia. Three questions on your phone.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-paper/75">
                Not the same questions as the person next to you.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-paper/75">
                Right answers and speed become {table.name}&apos;s score.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto pt-3">
              <p className="text-sm leading-relaxed text-paper/75">
                Tap ready. Trivia starts together.
              </p>
              <ul className="mt-5 space-y-2">
                {table.members.map((member) => (
                  <li
                    key={member.nickname}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className={member.mine ? "text-honey" : "text-paper/85"}>
                      {member.nickname}
                      {member.mine ? " · you" : ""}
                    </span>
                    <span className="text-xs text-paper/45">
                      {member.ready ? "ready" : "…"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="shrink-0 pt-3">
            {error ? <p className="mb-2 text-sm text-clay">{error}</p> : null}
            {table.status === "open" && table.mineCreator ? (
              <>
                <p className="pb-2 text-center text-sm text-paper/70">
                  Start when every name is in the list.
                </p>
                <button
                  type="button"
                  onClick={() => void lock()}
                  disabled={busy}
                  className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
                >
                  {busy ? "Sitting…" : "Everyone’s here"}
                </button>
              </>
            ) : showTriviaBrief ? (
              <button
                type="button"
                onClick={dismissTriviaBrief}
                className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
              >
                Ready up
              </button>
            ) : table.status === "open" ? (
              <p className="pb-2 text-center text-sm text-paper/50">
                {starterName
                  ? `${starterName} starts when everyone’s here.`
                  : "They start when everyone’s here."}
              </p>
            ) : table.allReady ? (
              <button
                type="button"
                onClick={() => void go()}
                disabled={busy}
                className="btn-honey flex h-16 w-full items-center justify-center rounded-full bg-honey font-display text-3xl text-ink disabled:opacity-40"
              >
                {busy ? "…" : "GO"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void readyUp()}
                disabled={busy || Boolean(table.members.find((member) => member.mine)?.ready)}
                className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
              >
                {table.members.find((member) => member.mine)?.ready
                  ? "You’re ready"
                  : busy
                    ? "…"
                    : "Ready"}
              </button>
            )}
          </div>
        </div>
        )
      ) : previewLocked ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center text-center">
          <p className="text-sm tracking-[0.18em] text-honey uppercase">
            {paw.hostDisplayName}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05]">
            They already started.
          </h1>
          <p className="mt-3 text-paper/65">
            {name ? `${name} locked in.` : "That table locked in."} Sit a new
            one, or wait for the next round.
          </p>
          <button
            type="button"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-full border border-paper/20 text-base text-paper"
            onClick={() => {
              setPreviewLocked(false);
              setJoining(false);
              setCode("");
              setName("");
              setError("");
            }}
          >
            Name a new table
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 pb-4">
            <p className="text-sm tracking-[0.18em] text-honey uppercase">
              {paw.hostDisplayName}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05]">
              {joining ? "Join the table." : "Name your table."}
            </h1>
          </header>
          <form
            onSubmit={joining ? join : create}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {joining ? (
                initialCode ? null : (
                  <label className="block">
                    <span className="text-xs tracking-[0.16em] text-paper/45 uppercase">
                      Code
                    </span>
                    <input
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.toUpperCase());
                        setError("");
                      }}
                      maxLength={TABLE_CODE_LENGTH}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1 h-12 w-full rounded-2xl border border-paper/20 bg-paper/8 px-4 font-condensed text-2xl tracking-[0.24em] text-paper outline-none focus:border-honey"
                    />
                  </label>
                )
              ) : (
                <label className="block">
                  <span className="text-xs tracking-[0.16em] text-paper/45 uppercase">
                    Table
                  </span>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    maxLength={TABLE_NAME_MAX}
                    placeholder="Bad Decisions"
                    className="mt-1 h-12 w-full rounded-2xl border border-paper/20 bg-paper/8 px-4 text-base text-paper outline-none placeholder:text-paper/35 focus:border-honey"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-xs tracking-[0.16em] text-paper/45 uppercase">
                  What do they call you
                </span>
                <input
                  value={nickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setError("");
                  }}
                  maxLength={TABLE_NICK_MAX}
                  placeholder="Maya"
                  className="mt-1 h-12 w-full rounded-2xl border border-paper/20 bg-paper/8 px-4 text-base text-paper outline-none placeholder:text-paper/35 focus:border-honey"
                />
              </label>
              {error ? <p className="text-sm text-clay">{error}</p> : null}
            </div>
            <div className="shrink-0 space-y-2 pt-3">
              <button
                type="submit"
                disabled={busy}
                className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink disabled:opacity-40"
              >
                {busy ? "Sitting…" : joining ? "Join" : "Sit down"}
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center text-sm text-paper/50"
                onClick={() => {
                  setJoining((open) => !open);
                  setError("");
                }}
              >
                {joining ? "Name a new table" : "Already have a code?"}
              </button>
            </div>
          </form>
        </div>
      )}
    </ScannerShell>
  );
}

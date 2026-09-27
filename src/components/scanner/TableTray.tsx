"use client";

import { StackRound } from "@/components/lab/stack/StackRound";
import type { StackCarryResult } from "@/components/lab/stack/StackRound";
import "@/components/lab/stack/stack.css";
import type { NightTableView } from "@/lib/night-table-types";
import { waitingOnLine } from "@/lib/table-test";
import { useState } from "react";

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

export function TableTray({
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
  const [brief, setBrief] = useState<"picked" | "how" | "play">("picked");
  const tray = table.tray;

  async function complete(results: StackCarryResult[]) {
    if (busy || !tray) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(pawToken)}/tables/${encodeURIComponent(table.joinCode)}/tray/carry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceHint: deviceHint(),
            carries: results.map((row) => ({
              glasses: row.glasses,
              wobble: row.wobble,
            })),
          }),
        },
      );
      const payload = (await response.json()) as NightTableView & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Couldn’t lock that carry.");
        setBusy(false);
        return;
      }
      onTable(payload);
    } catch {
      setError("Couldn’t lock that carry.");
    }
    setBusy(false);
  }

  if (!tray) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-paper/50">The tray…</p>
      </div>
    );
  }

  if (tray.minePlays && brief === "picked") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <p className="text-sm tracking-[0.18em] text-honey uppercase">The tray</p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            You have been selected.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-paper/75">
            {tray.championNickname
              ? `${tray.championNickname} carries for ${table.name}.`
              : `You carry for ${table.name}.`}{" "}
            The rest of the table waits on this phone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBrief("how")}
          className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
        >
          How to carry
        </button>
      </div>
    );
  }

  if (tray.minePlays && brief === "how") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="text-sm tracking-[0.18em] text-honey uppercase">The tray</p>
          <h1 className="mt-3 font-display text-3xl leading-tight">
            Catch it on the side it tips.
          </h1>
          <div className="mt-6 rounded-[1.6rem] border border-paper/12 bg-paper/6 px-4 py-5">
            <div className="flex items-end justify-center gap-2">
              <span className="mb-3 h-8 w-6 rounded-b-full rounded-t-md border border-honey/40 bg-honey/15" />
              <span className="mb-1 h-8 w-6 origin-bottom rotate-12 rounded-b-full rounded-t-md border border-honey/70 bg-honey/25" />
              <span className="h-8 w-6 origin-bottom rotate-[22deg] rounded-b-full rounded-t-md border border-honey bg-honey/40" />
            </div>
            <p className="mt-4 text-center text-sm text-paper/80">
              The tray tips right. Tap the right side.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex h-14 items-center justify-center rounded-2xl border border-paper/15 text-sm text-paper/45">
                Tap left
              </div>
              <div className="flex h-14 items-center justify-center rounded-2xl border border-honey/50 bg-honey/15 text-sm font-semibold text-honey">
                Tap right
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-paper/75">
            If it tips left, tap left. Steadier is better. A drop costs{" "}
            {table.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBrief("play")}
          className="btn-honey mt-4 flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
        >
          Carry it
        </button>
      </div>
    );
  }

  if (tray.minePlays) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 text-sm tracking-[0.18em] text-honey uppercase">
          The tray
          {tray.championNickname ? ` · ${tray.championNickname}` : ""}
        </p>
        <div className="min-h-0 flex-1">
          <StackRound seed={tray.seed} live onComplete={complete} />
        </div>
        {error ? <p className="pt-2 text-sm text-clay">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center text-center">
      <p className="text-sm tracking-[0.18em] text-honey uppercase">The tray</p>
      <p className="mt-3 font-display text-2xl leading-tight">
        {tray.mode === "champion" && tray.championNickname
          ? `${tray.championNickname} was picked to carry.`
          : waitingOnLine(tray.waitingNames)}
      </p>
      <p className="mt-3 text-sm text-paper/60">
        Stay on this screen. The result shows up when they finish.
      </p>
    </div>
  );
}

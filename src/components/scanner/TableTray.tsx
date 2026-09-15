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

  if (tray.minePlays) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 text-sm tracking-[0.18em] text-honey uppercase">
          The tray
          {tray.mode === "champion" && tray.championNickname
            ? ` · ${tray.championNickname}`
            : ""}
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
          ? `${tray.championNickname} is carrying.`
          : waitingOnLine(tray.waitingNames)}
      </p>
    </div>
  );
}

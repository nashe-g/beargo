"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/campaigns";
import type { HostRecord } from "@/lib/hosts";

export function CampaignControls({
  campaign,
  hosts,
}: {
  campaign: Campaign;
  hosts: HostRecord[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(campaign.eligibleHostIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(patch: {
    status?: Campaign["status"];
    eligibleHostIds?: string[];
  }) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setError("Could not save.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save.");
    }
    setBusy(false);
  }

  function toggleHost(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || campaign.status === "live"}
          onClick={() => save({ status: "live" })}
          className="h-12 rounded-full bg-ink px-5 text-paper disabled:opacity-40"
        >
          Set live
        </button>
        <button
          type="button"
          disabled={busy || campaign.status === "paused"}
          onClick={() => save({ status: "paused" })}
          className="h-12 rounded-full border border-ink/20 px-5 disabled:opacity-40"
        >
          Pause
        </button>
      </div>

      <div>
        <h3 className="font-display text-2xl">Assign hosts</h3>
        <ul className="mt-4 space-y-2">
          {hosts.map((host) => (
            <li key={host.id}>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-ink/10 px-4">
                <input
                  type="checkbox"
                  checked={selected.includes(host.id)}
                  onChange={() => toggleHost(host.id)}
                  className="size-4 accent-honey"
                />
                {host.displayName}
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => save({ eligibleHostIds: selected })}
          className="mt-4 h-12 rounded-full bg-ink px-5 text-paper disabled:opacity-40"
        >
          Save routing
        </button>
      </div>
      {error ? <p className="text-clay">{error}</p> : null}
    </div>
  );
}

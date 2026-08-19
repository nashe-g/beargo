"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HostRecord } from "@/lib/hosts";
import { CANONICAL_ORIGIN, pawScanUrl } from "@/lib/config";

export function CreatePawForm({ hosts }: { hosts: HostRecord[] }) {
  const router = useRouter();
  const [hostId, setHostId] = useState(hosts[0]?.id ?? "");
  const [placementLabel, setPlacementLabel] = useState("");
  const [created, setCreated] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setCreated("");
    const response = await fetch("/api/admin/paws", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId, placementLabel }),
    });
    const payload = (await response.json()) as {
      paw?: { token: string };
      error?: string;
    };
    if (!response.ok || !payload.paw) {
      setError(payload.error ?? "Could not create Paw.");
      return;
    }
    setPlacementLabel("");
    setCreated(payload.paw.token);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-ink-soft">
        BearGo assigns a unique scan token. Placement is only where the sticker
        sits in the room.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          required
          value={hostId}
          onChange={(event) => setHostId(event.target.value)}
          className="h-12 rounded-full border border-ink/15 px-4"
        >
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.displayName}
            </option>
          ))}
        </select>
        <input
          required
          value={placementLabel}
          onChange={(event) => setPlacementLabel(event.target.value)}
          placeholder="Placement, e.g. Bar top"
          className="h-12 min-w-[12rem] flex-1 rounded-full border border-ink/15 px-4"
        />
        <button
          type="submit"
          className="h-12 rounded-full bg-ink px-5 text-paper"
        >
          Add Paw
        </button>
      </div>
      {created ? (
        <p className="text-sm">
          Created{" "}
          <a
            href={pawScanUrl(created, CANONICAL_ORIGIN)}
            className="underline-offset-2 hover:underline"
          >
            {pawScanUrl(created, CANONICAL_ORIGIN).replace("https://", "")}
          </a>
        </p>
      ) : null}
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HostRecord } from "@/lib/hosts";

export function CreatePawForm({ hosts }: { hosts: HostRecord[] }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [hostId, setHostId] = useState(hosts[0]?.id ?? "");
  const [placementLabel, setPlacementLabel] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/paws", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, hostId, placementLabel }),
    });
    if (!response.ok) {
      setError("Could not create Paw.");
      return;
    }
    setToken("");
    setPlacementLabel("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        required
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="token"
        className="h-12 rounded-full border border-ink/15 px-4"
      />
      <select
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
        placeholder="Placement"
        className="h-12 rounded-full border border-ink/15 px-4"
      />
      <button
        type="submit"
        className="h-12 rounded-full bg-ink px-5 text-paper"
      >
        Add Paw
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

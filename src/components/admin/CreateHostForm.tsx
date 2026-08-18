"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateHostForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("Houston");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, city, timezone: "America/Chicago" }),
    });
    if (!response.ok) {
      setError("Could not create host.");
      return;
    }
    setDisplayName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        required
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Host name"
        className="h-12 rounded-full border border-ink/15 px-4"
      />
      <input
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="City"
        className="h-12 rounded-full border border-ink/15 px-4"
      />
      <button type="submit" className="h-12 rounded-full bg-ink px-5 text-paper">
        Add host
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

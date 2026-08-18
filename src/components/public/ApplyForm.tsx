"use client";

import { useState } from "react";

export function ApplyForm({ kind }: { kind: "host" | "startup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [city, setCity] = useState("Houston");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        payload: { name, email, oneLiner, city },
      }),
    });
    if (!response.ok) {
      setError("Could not send. Try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-8 rounded-3xl bg-paper-deep px-5 py-5">
        Got it. We’ll review and email you a sign-in link if we take you live.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <input
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={kind === "host" ? "Venue name" : "Company name"}
        className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 outline-none focus:border-honey"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 outline-none focus:border-honey"
      />
      <input
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="City"
        className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 outline-none focus:border-honey"
      />
      <input
        value={oneLiner}
        onChange={(event) => setOneLiner(event.target.value)}
        placeholder={kind === "host" ? "Neighborhood or type" : "One-liner"}
        className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 outline-none focus:border-honey"
      />
      <button
        type="submit"
        className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold text-ink"
      >
        Apply
      </button>
      {error ? <p className="text-clay">{error}</p> : null}
    </form>
  );
}

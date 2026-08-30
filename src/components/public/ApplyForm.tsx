"use client";

import { useState } from "react";

export function ApplyForm({ kind }: { kind: "host" | "merchant" }) {
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
      <p className="mt-6 rounded-2xl bg-paper-deep/80 px-5 py-4 leading-relaxed">
        Got it. We’ll review and email you a sign-in link if we take you live.
      </p>
    );
  }

  const field =
    "mt-1.5 h-12 w-full rounded-2xl border border-ink/15 bg-paper/80 px-4 outline-none transition-colors focus:border-honey";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm text-ink-soft">
        {kind === "host" ? "Venue name" : "Business name"}
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm text-ink-soft">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm text-ink-soft">
        City
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className={field}
        />
      </label>
      {kind === "merchant" ? (
        <label className="block text-sm text-ink-soft">
          What you sell, in one line
          <input
            value={oneLiner}
            onChange={(event) => setOneLiner(event.target.value)}
            className={field}
          />
        </label>
      ) : null}
      <button
        type="submit"
        className="btn-honey flex h-12 w-full items-center justify-center rounded-full bg-honey text-base font-semibold text-ink"
      >
        Apply
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

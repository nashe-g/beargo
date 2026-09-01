"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HostLoginForm({
  hostId,
  emails,
}: {
  hostId: string;
  emails: string[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/admin/hosts/${hostId}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not save login.");
      return;
    }
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      {emails.length === 0 ? (
        <p className="text-ink-soft">No login yet. They cannot sign in.</p>
      ) : (
        <ul className="space-y-1 text-ink-soft">
          {emails.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Login email"
          className="h-12 min-w-[12rem] flex-1 rounded-full border border-ink/15 px-4 outline-none focus:border-honey"
        />
        <button
          type="submit"
          className="h-12 rounded-full bg-ink px-5 text-paper"
        >
          {emails.length === 0 ? "Add login" : "Add another"}
        </button>
      </div>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

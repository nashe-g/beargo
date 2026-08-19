"use client";

import { useState } from "react";

export function MagicLinkForm({
  next,
  label = "Email me a sign-in link",
  placeholder = "you@gmail.com",
}: {
  next: string;
  label?: string;
  placeholder?: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const payload = (await response.json()) as {
        error?: string;
        sent?: boolean;
        mode?: string;
      };
      if (!response.ok) {
        setMessage(payload.error ?? "Could not send a link.");
      } else if (payload.sent) {
        setMessage(
          payload.mode === "log"
            ? "Link sent to the local mail log. Open /lab/mail."
            : "If that email is on file, the link is on its way.",
        );
      } else {
        setMessage("If that email is on file, the link is on its way.");
      }
    } catch {
      setMessage("Could not send a link.");
    }
    setBusy(false);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-full border border-ink/15 bg-paper px-5"
      />
      <button
        type="submit"
        disabled={busy}
        className="flex h-14 w-full items-center justify-center rounded-full bg-ink text-paper disabled:opacity-60"
      >
        {label}
      </button>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
    </form>
  );
}

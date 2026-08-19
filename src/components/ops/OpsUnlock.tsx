"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PawMark } from "@/components/paw/PawMark";
import { staffDestination } from "@/lib/ops-gate";

export function OpsUnlock() {
  const router = useRouter();
  const search = useSearchParams();
  const next = staffDestination(search.get("next"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("That password doesn’t work.");
        setBusy(false);
        return;
      }
      router.replace(next ?? "/ops");
      router.refresh();
    } catch {
      setError("Could not unlock.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <form
        onSubmit={submit}
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10"
      >
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Staff</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Sign in as admin, host, or merchant.
          </p>
        </div>
        <div className="space-y-4">
          <label className="block space-y-2 text-left">
            <span className="text-sm tracking-[0.16em] uppercase text-ink-soft">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 w-full rounded-2xl border border-ink/15 bg-paper-deep px-4 text-lg outline-none"
            />
          </label>
          {error ? <p className="text-clay">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !password}
            className="flex h-14 w-full items-center justify-center rounded-full bg-ink text-paper disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}

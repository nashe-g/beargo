"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionCandidate } from "@/lib/questions-pipeline";

export function GenerateQuestions({
  configured,
  candidates,
}: {
  configured: boolean;
  candidates: QuestionCandidate[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<number | null>(null);

  async function generate() {
    setBusy(true);
    setError("");
    setCreated(null);
    try {
      const response = await fetch("/api/admin/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 6, note }),
      });
      const payload = (await response.json()) as {
        error?: string;
        created?: number;
      };
      if (!response.ok) {
        setError(payload.error ?? "Generation failed.");
      } else {
        setCreated(payload.created ?? 0);
        router.refresh();
      }
    } catch {
      setError("Generation failed.");
    }
    setBusy(false);
  }

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/questions/candidates/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  const queue = candidates.filter(
    (candidate) =>
      candidate.verificationStatus === "needs_review" ||
      candidate.verificationStatus === "invalid",
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-ink/10 px-6 py-6">
        <h2 className="font-display text-2xl">Generate drafts</h2>
        <p className="mt-2 text-ink-soft">
          Runs from this button. Drafts are validated, then wait here until you
          approve them into the live pool. They never go live during a scan.
        </p>
        {!configured ? (
          <p className="mt-4 text-clay">
            No OPENAI_API_KEY. Add it to generate. The live game still uses the
            approved pool.
          </p>
        ) : null}
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note: more Houston food, fewer sports…"
          className="mt-4 min-h-24 w-full rounded-2xl border border-ink/15 px-4 py-3"
        />
        <button
          type="button"
          disabled={busy || !configured}
          onClick={generate}
          className="mt-4 h-12 rounded-full bg-ink px-6 text-paper disabled:opacity-40"
        >
          {busy ? "Generating…" : "Generate 6 drafts"}
        </button>
        {created != null ? (
          <p className="mt-3 text-sm text-ink-soft">
            Queued {created} candidate{created === 1 ? "" : "s"} for review.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-clay">{error}</p> : null}
      </div>

      <div>
        <h2 className="font-display text-2xl">Review queue</h2>
        {queue.length === 0 ? (
          <p className="mt-4 text-ink-soft">Nothing waiting.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {queue.map((candidate) => (
              <li
                key={candidate.id}
                className="rounded-3xl border border-ink/10 px-5 py-5"
              >
                <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                  {candidate.difficulty} · {candidate.category} ·{" "}
                  {candidate.verificationStatus.replaceAll("_", " ")}
                </p>
                <p className="mt-2 font-display text-2xl">{candidate.prompt}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {candidate.choices.map((choice) => (
                    <li key={choice.id}>
                      {choice.id.toUpperCase()}. {choice.label}
                      {choice.id === candidate.correctId ? " · correct" : ""}
                    </li>
                  ))}
                </ul>
                {candidate.explanation ? (
                  <p className="mt-3 text-ink-soft">{candidate.explanation}</p>
                ) : null}
                {candidate.validationErrors.length > 0 ? (
                  <ul className="mt-3 text-sm text-clay">
                    {candidate.validationErrors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => act(candidate.id, "approve")}
                    disabled={candidate.verificationStatus === "invalid"}
                    className="h-11 rounded-full bg-ink px-5 text-paper disabled:opacity-40"
                  >
                    Approve into pool
                  </button>
                  <button
                    type="button"
                    onClick={() => act(candidate.id, "reject")}
                    className="h-11 rounded-full border border-ink/20 px-5"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

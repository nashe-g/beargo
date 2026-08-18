"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { Campaign } from "@/lib/campaigns";
import { loadLeadSession, saveLeadSession } from "@/lib/lead-session";
import type { PawRecord } from "@/lib/paws";

export function QualifyConsent({
  paw,
  campaign,
}: {
  paw: PawRecord;
  campaign: Campaign;
}) {
  const router = useRouter();
  const [leadId, setLeadId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadLeadSession(paw.token);
    if (session?.leadId) setLeadId(session.leadId);
    if (!session?.leadId) return;

    fetch(`/api/p/${paw.token}/leads/${session.leadId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { emailVerified?: boolean } | null) => {
        if (payload && payload.emailVerified === false) {
          router.replace(`/p/${paw.token}/verify`);
        }
      })
      .catch(() => undefined);
  }, [paw.token, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const complete = campaign.questions.every(
      (question) => answers[question.id],
    );
    if (!complete || !consent || !leadId) {
      setError("Answer the questions and agree to finish.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${paw.token}/leads/${leadId}/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, consent: true }),
        },
      );
      const payload = (await response.json()) as {
        status?: string;
        hostAmount?: number;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not finish the introduction.");
        setBusy(false);
        return;
      }

      saveLeadSession(paw.token, { hostAmount: payload.hostAmount });
      router.push(`/p/${paw.token}/complete`);
    } catch {
      setError("Could not finish the introduction.");
      setBusy(false);
    }
  }

  return (
    <ScannerShell progress={{ filledToes: 3 }}>
      <form className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto py-4" onSubmit={submit}>
        <div className="space-y-6">
          <BearGuide state="idle" size="sm" />
          <h1 className="font-display text-4xl">Almost done</h1>
          {campaign.questions.map((question) => (
            <fieldset key={question.id} className="space-y-3">
              <legend className="text-lg">{question.prompt}</legend>
              {question.options.map((option) => (
                <Choice
                  key={option.id}
                  name={question.id}
                  checked={answers[question.id] === option.id}
                  label={option.label}
                  onChange={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: option.id,
                    }))
                  }
                />
              ))}
            </fieldset>
          ))}
          <p className="text-sm text-paper/55">
            {campaign.name} will receive the details and responses you provided
            when you finish.
          </p>
          <label className="flex gap-3 text-sm text-paper/80">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-4 accent-honey"
            />
            <span>
              By finishing, you agree that we may share your name, email, phone
              number, and responses with {campaign.name} so they can follow up
              about their service. See{" "}
              <a href="/privacy" className="underline">
                Privacy
              </a>{" "}
              and{" "}
              <a href="/terms" className="underline">
                Terms
              </a>
              .
            </span>
          </label>
          {error ? <p className="text-clay">{error}</p> : null}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="btn-honey flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.08em] text-ink disabled:opacity-60"
        >
          FINISH INTRODUCTION
        </button>
      </form>
    </ScannerShell>
  );
}

function Choice({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-h-14 items-center rounded-2xl border px-4 text-lg ${
        checked ? "border-honey bg-honey/15" : "border-paper/15 bg-paper/5"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

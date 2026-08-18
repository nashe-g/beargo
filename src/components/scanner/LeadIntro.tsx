"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import type { Campaign } from "@/lib/campaigns";
import { loadLeadSession, saveLeadSession } from "@/lib/lead-session";
import { normalizePhone } from "@/lib/normalize";
import type { PawRecord } from "@/lib/paws";

type Step = "great" | "details";

export function LeadIntro({
  paw,
  campaign,
  from,
}: {
  paw: PawRecord;
  campaign: Campaign;
  from?: string;
}) {
  const router = useRouter();
  const deferred = from === "later";
  const [step, setStep] = useState<Step>(deferred ? "details" : "great");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.includes("@") || normalizePhone(phone).length < 10) {
      setError("Name, email, and a 10-digit phone number are required.");
      return;
    }

    setBusy(true);
    const session = loadLeadSession(paw.token);
    try {
      const response = await fetch(`/api/p/${paw.token}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: session?.campaignId ?? campaign.id,
          interestId: session?.interestId ?? "try",
          fullName,
          email,
          phone,
        }),
      });
      const payload = (await response.json()) as {
        status?: string;
        leadId?: string;
        email?: string;
        mailSent?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not save your details.");
        setBusy(false);
        return;
      }

      saveLeadSession(paw.token, {
        campaignId: campaign.id,
        leadId: payload.leadId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        mailSent: payload.mailSent,
      });

      if (payload.status === "duplicate") {
        router.push(`/p/${paw.token}/already`);
        return;
      }

      router.push(`/p/${paw.token}/verify`);
    } catch {
      setError("Could not save your details.");
      setBusy(false);
    }
  }

  if (step === "great") {
    return (
      <ScannerShell progress={{ filledToes: 1 }}>
        <div className="flex flex-1 flex-col justify-between py-4">
          <div className="space-y-6">
            <BearGuide state="reactCorrect" size="md" />
            <h1 className="font-display text-4xl">Great.</h1>
            <p className="text-xl text-paper/80">
              If you complete the introduction, {campaign.name} pays{" "}
              {paw.hostDisplayName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("details")}
            className="btn-honey flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
          >
            CONTINUE
          </button>
        </div>
      </ScannerShell>
    );
  }

  return (
    <ScannerShell progress={{ filledToes: 1 }}>
      <form className="flex flex-1 flex-col justify-between py-4" onSubmit={submit}>
        <div className="space-y-5">
          <BearGuide state="idle" size="sm" />
          <h1 className="font-display text-4xl">Your details</h1>
          <p className="text-paper/70">
            {deferred
              ? `No rush. Leave your details and ${campaign.name} can follow up when you’re ready. If you finish, they pay ${paw.hostDisplayName}.`
              : "We’ll verify your email before the introduction is complete."}
          </p>
          <label className="block space-y-2">
            <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
              Name
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="h-14 w-full rounded-2xl border border-paper/15 bg-paper/5 px-4 text-lg outline-none"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-14 w-full rounded-2xl border border-paper/15 bg-paper/5 px-4 text-lg outline-none"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className="h-14 w-full rounded-2xl border border-paper/15 bg-paper/5 px-4 text-lg outline-none"
            />
          </label>
          <p className="text-sm text-paper/55">
            If you finish, the information you provide will be shared with{" "}
            {campaign.name}.
          </p>
          {error ? <p className="text-clay">{error}</p> : null}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="btn-honey mt-8 flex h-14 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink disabled:opacity-60"
        >
          CONTINUE
        </button>
      </form>
    </ScannerShell>
  );
}

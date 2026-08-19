"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import type { OfferCard } from "@/lib/select-promotion";
import type { PawRecord } from "@/lib/paws";

type Step = "offer" | "form" | "wait";

export function OfferReveal({
  paw,
  offer,
  known,
}: {
  paw: PawRecord;
  offer: OfferCard;
  known?: { fullName: string; email: string; phone: string } | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("offer");
  const [fullName, setFullName] = useState(known?.fullName ?? "");
  const [email, setEmail] = useState(known?.email ?? "");
  const [phone, setPhone] = useState(known?.phone ?? "");
  const [sentTo, setSentTo] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [mailMode, setMailMode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitClaim(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${paw.token}/offers/${offer.promotionId}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, phone }),
        },
      );
      const payload = (await response.json()) as {
        token?: string;
        verify?: boolean;
        sent?: boolean;
        mode?: string;
        email?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not claim this offer.");
        setBusy(false);
        return;
      }
      if (payload.token) {
        router.push(`/p/${paw.token}/voucher/${payload.token}`);
        return;
      }
      setSentTo(payload.email ?? email);
      setMailSent(Boolean(payload.sent));
      setMailMode(payload.mode ?? "");
      setStep("wait");
    } catch {
      setError("Could not claim this offer.");
    }
    setBusy(false);
  }

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="offer_viewed"
        promotionId={offer.promotionId}
      />
      <StampSession
        pawToken={paw.token}
        event="teaser_opened"
        promotionId={offer.promotionId}
      />
      {step === "offer" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-between py-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-honey uppercase">
              {offer.categoryLabel}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight">
              {offer.offerTitle}
            </h1>
            <p className="mt-4 font-display text-2xl">{offer.merchantName}</p>
            <p className="mt-2 text-lg text-paper/75">{offer.address}</p>
            <p className="mt-2 text-paper/70">
              {[offer.distanceLabel, offer.urgency].filter(Boolean).join(" · ")}
            </p>
            {offer.shortTerms ? (
              <p className="mt-6 text-paper/75">{offer.shortTerms}</p>
            ) : null}
            {offer.restrictions ? (
              <p className="mt-3 text-sm text-paper/55">{offer.restrictions}</p>
            ) : null}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink"
            >
              CLAIM FREE
            </button>
            <p className="mt-3 text-center text-sm text-paper/50">
              You pay $0.
            </p>
          </div>
        </div>
      ) : null}

      {step === "form" ? (
        <form
          onSubmit={submitClaim}
          className="flex min-h-0 flex-1 flex-col justify-between py-3"
        >
          <div>
            <p className="text-xs tracking-[0.22em] text-honey uppercase">
              Claim {offer.offerTitle}
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight">
              How do we reach you?
            </h1>
            <p className="mt-2 text-sm text-paper/70">
              We’ll email a link to unlock the voucher. You pay $0.
            </p>
            <div className="mt-5 space-y-3">
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Name"
                autoComplete="name"
                className="h-12 w-full rounded-full border border-paper/20 bg-paper/10 px-5 text-paper outline-none placeholder:text-paper/40 focus:border-honey"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="h-12 w-full rounded-full border border-paper/20 bg-paper/10 px-5 text-paper outline-none placeholder:text-paper/40 focus:border-honey"
              />
              <input
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                autoComplete="tel"
                className="h-12 w-full rounded-full border border-paper/20 bg-paper/10 px-5 text-paper outline-none placeholder:text-paper/40 focus:border-honey"
              />
            </div>
          </div>
          <div>
            {error ? <p className="mb-3 text-clay">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.18em] text-ink disabled:opacity-60"
            >
              {busy ? "SENDING" : "EMAIL ME THE VOUCHER"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "wait" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-between py-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-honey uppercase">
              Almost
            </p>
            {mailSent ? (
              <>
                <h1 className="mt-3 font-display text-3xl leading-tight">
                  Check {sentTo}
                </h1>
                <p className="mt-4 text-lg text-paper/75">
                  Tap the link in that email to unlock your voucher.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-3 font-display text-3xl leading-tight">
                  We couldn’t send that email.
                </h1>
                <p className="mt-4 text-lg text-paper/75">
                  Try again. We won’t ask you to check an inbox we didn’t reach.
                </p>
              </>
            )}
          </div>
          <div className="space-y-3">
            {mailMode === "log" ? (
              <Link
                href="/lab/mail"
                className="flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold text-ink"
              >
                Open local mailbox
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => submitClaim()}
              disabled={busy}
              className="flex h-14 w-full items-center justify-center rounded-full border border-paper/25 text-paper disabled:opacity-60"
            >
              {busy ? "SENDING" : "Resend"}
            </button>
          </div>
        </div>
      ) : null}
    </ScannerShell>
  );
}

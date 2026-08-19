"use client";

import { useState } from "react";

export function RedeemDesk({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [subtotal, setSubtotal] = useState("");
  const [preview, setPreview] = useState<{
    offerTitle: string;
    merchantName: string;
    minimum: string;
    discountType: string;
    apply?: string;
    needsSubtotal?: boolean;
  } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          code,
          subtotal: subtotal || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        offerTitle?: string;
        merchantName?: string;
        minimum?: string;
        discountType?: string;
        apply?: string;
        needsSubtotal?: boolean;
      };
      if (!response.ok) {
        setPreview(null);
        setError(payload.error ?? "Could not find that voucher.");
        setBusy(false);
        return;
      }
      setPreview({
        offerTitle: payload.offerTitle ?? "",
        merchantName: payload.merchantName ?? "",
        minimum: payload.minimum ?? "",
        discountType: payload.discountType ?? "",
        apply: payload.apply,
        needsSubtotal: payload.needsSubtotal,
      });
    } catch {
      setError("Could not look up that voucher.");
    }
    setBusy(false);
  }

  async function redeem() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeem",
          code,
          subtotal: subtotal || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        apply?: string;
        billed?: boolean;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not redeem.");
        setBusy(false);
        return;
      }
      setResult(
        payload.apply
          ? `${payload.apply}${payload.billed === false ? " · test offer, no BearGo fee" : ""}`
          : "Redeemed.",
      );
    } catch {
      setError("Could not redeem.");
    }
    setBusy(false);
  }

  if (result) {
    return (
      <div className="rounded-[2rem] bg-moss px-6 py-10 text-paper">
        <p className="text-sm tracking-[0.2em] uppercase text-paper/70">
          Redeemed
        </p>
        <h2 className="mt-3 font-display text-4xl">{result}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm tracking-[0.16em] uppercase text-ink-soft">
          Voucher code
        </span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="BG-7K4M2"
          className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 font-condensed tracking-[0.12em] outline-none focus:border-honey"
        />
      </label>
      {preview?.needsSubtotal || preview?.discountType === "percentage" ? (
        <label className="block space-y-2">
          <span className="text-sm tracking-[0.16em] uppercase text-ink-soft">
            Purchase subtotal (optional for $ off)
          </span>
          <input
            inputMode="decimal"
            value={subtotal}
            onChange={(event) => setSubtotal(event.target.value)}
            placeholder="42.00"
            className="h-14 w-full rounded-full border border-ink/15 bg-pad/80 px-5 outline-none focus:border-honey"
          />
        </label>
      ) : null}
      {preview ? (
        <div className="rounded-[2rem] border border-ink/10 px-5 py-6">
          <p className="text-sm tracking-[0.16em] uppercase text-ink-soft">
            BearGo offer
          </p>
          <h2 className="mt-2 font-display text-3xl">{preview.offerTitle}</h2>
          <p className="mt-2 text-ink-soft">
            Confirm the qualifying purchase is at least {preview.minimum}.
          </p>
          {preview.apply ? (
            <p className="mt-3 font-semibold">{preview.apply}</p>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-clay">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={lookup}
          disabled={busy || !code.trim()}
          className="flex h-14 flex-1 items-center justify-center rounded-full border border-ink/20"
        >
          Look up
        </button>
        <button
          type="button"
          onClick={redeem}
          disabled={busy || !preview}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40"
        >
          REDEEM OFFER
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { offerWindowLabel } from "@/lib/format";
import { promotionStatusLabel } from "@/lib/offer";

export type PendingOfferCard = {
  id: string;
  title: string;
  subtitle: string;
  detail?: string;
  shortTerms?: string | null;
  validThrough: string | null;
};

export function PendingOfferReview({ offers }: { offers: PendingOfferCard[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function act(id: string, action: "approve" | "decline") {
    setBusyId(id);
    setMessage("");
    const reason = (reasonById[id] ?? "").trim();
    if (action === "decline" && reason.length < 3) {
      setMessage("Add a reason before declining.");
      setBusyId("");
      return;
    }
    const response = await fetch(`/api/admin/promotions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMessage(payload.error ?? "Could not update this offer.");
      setBusyId("");
      return;
    }
    setBusyId("");
    router.refresh();
  }

  if (offers.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl">Waiting for review</h2>
      <ul className="mt-4 space-y-4">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="text-sm">
              <span className="rounded-full bg-ink/10 px-3 py-1 text-ink-soft">
                {promotionStatusLabel("pending")}
              </span>
            </p>
            <h3 className="mt-3 font-display text-3xl">{offer.title}</h3>
            <p className="mt-2 text-ink-soft">{offer.subtitle}</p>
            {offer.detail ? (
              <p className="mt-1 text-sm text-ink-soft">{offer.detail}</p>
            ) : null}
            <p className="mt-2 text-sm text-ink-soft">
              {offerWindowLabel({
                status: "pending",
                until: offer.validThrough,
              })}
            </p>
            {offer.shortTerms ? <p className="mt-3">{offer.shortTerms}</p> : null}
            <label className="mt-4 block space-y-1">
              <span className="px-1 text-sm text-ink-soft">
                Decline reason
              </span>
              <textarea
                value={reasonById[offer.id] ?? ""}
                onChange={(event) =>
                  setReasonById((current) => ({
                    ...current,
                    [offer.id]: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-3xl border border-ink/15 px-4 py-3 outline-none focus:border-honey"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busyId === offer.id}
                onClick={() => act(offer.id, "approve")}
                className="h-11 rounded-full bg-ink px-5 text-paper disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === offer.id}
                onClick={() => act(offer.id, "decline")}
                className="h-11 rounded-full border border-ink/20 px-5 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p className="mt-3 text-sm text-clay">{message}</p> : null}
    </div>
  );
}

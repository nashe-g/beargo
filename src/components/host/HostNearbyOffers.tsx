"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NearbyOfferCards } from "@/components/offers/NearbyOfferCards";
import { categoryLabel, offerTitle } from "@/lib/offer";
import type { NearbyOffer } from "@/lib/select-promotion";

export function HostNearbyOffers({
  nearby,
  excludedPromotionIds,
}: {
  nearby: NearbyOffer[];
  excludedPromotionIds: string[];
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(excludedPromotionIds);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function toggle(promotionId: string) {
    const next = blocked.includes(promotionId)
      ? blocked.filter((id) => id !== promotionId)
      : [...blocked, promotionId];
    setBusyId(promotionId);
    setMessage("");
    const response = await fetch("/api/host/exclusions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedPromotionIds: next }),
    });
    if (!response.ok) {
      setMessage("Could not save.");
      setBusyId("");
      return;
    }
    setBlocked(next);
    setBusyId("");
    router.refresh();
  }

  if (nearby.length === 0) {
    return <NearbyOfferCards nearby={nearby} blockedIds={blocked} />;
  }

  const shownId = nearby.find((item) => !blocked.includes(item.promotion.id))
    ?.promotion.id;

  return (
    <div>
      <ul className="mt-4 space-y-3">
        {nearby.map((item) => {
          const isBlocked = blocked.includes(item.promotion.id);
          const shown = item.promotion.id === shownId;
          return (
            <li
              key={item.promotion.id}
              className="rounded-3xl border border-ink/10 px-5 py-5"
            >
              <p className="text-sm">
                <span
                  className={`rounded-full px-3 py-1 ${
                    isBlocked
                      ? "bg-ink/10 text-ink-soft"
                      : shown
                        ? "bg-moss text-paper"
                        : "bg-ink/10 text-ink-soft"
                  }`}
                >
                  {isBlocked
                    ? "Blocked"
                    : shown
                      ? "Shown after rank"
                      : "In range"}
                </span>
              </p>
              <h3 className="mt-3 font-display text-2xl">
                {offerTitle(item.promotion)}
              </h3>
              <p className="mt-2">{item.promotion.merchant.displayName}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {item.card.distanceLabel} ·{" "}
                {categoryLabel(item.promotion.category)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {item.promotion.location.address}
              </p>
              <button
                type="button"
                disabled={busyId === item.promotion.id}
                onClick={() => toggle(item.promotion.id)}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-ink/20 disabled:opacity-50"
              >
                {isBlocked ? "Allow this offer" : "Block this offer"}
              </button>
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-3 text-sm text-clay">{message}</p> : null}
    </div>
  );
}

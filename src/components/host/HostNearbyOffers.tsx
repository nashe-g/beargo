"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NearbyOfferCards } from "@/components/offers/NearbyOfferCards";
import { categoryLabel, offerTitle } from "@/lib/offer";
import type { NearbyOffer } from "@/lib/select-promotion";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

export function HostNearbyOffers({
  nearby,
  excludedPromotionIds,
}: {
  nearby: NearbyOffer[];
  excludedPromotionIds: string[];
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(excludedPromotionIds);
  const [openId, setOpenId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenId("");
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId("");
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  async function toggle(promotionId: string) {
    const next = blocked.includes(promotionId)
      ? blocked.filter((id) => id !== promotionId)
      : [...blocked, promotionId];
    setBusyId(promotionId);
    setOpenId("");
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
          const open = openId === item.promotion.id;
          return (
            <li
              key={item.promotion.id}
              className="relative rounded-3xl border border-ink/10 px-5 py-5"
            >
              <div className="absolute right-3 top-3" ref={open ? menuRef : undefined}>
                <button
                  type="button"
                  aria-label="Offer actions"
                  aria-expanded={open}
                  disabled={busyId === item.promotion.id}
                  onClick={() =>
                    setOpenId(open ? "" : item.promotion.id)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-50"
                >
                  <MenuIcon />
                </button>
                {open ? (
                  <div className="absolute right-0 top-11 z-10 min-w-[12rem] rounded-2xl border border-ink/10 bg-paper py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => toggle(item.promotion.id)}
                      className="flex w-full px-4 py-3 text-left text-sm"
                    >
                      {isBlocked ? "Allow this offer" : "Block this offer"}
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="pr-12 text-sm">
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
                      ? "Paused · would have shown"
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
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-3 text-sm text-clay">{message}</p> : null}
    </div>
  );
}

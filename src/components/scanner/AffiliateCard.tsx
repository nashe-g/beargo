"use client";

import { useEffect, useRef } from "react";
import type { AffiliateCardView } from "@/lib/affiliate";

export function AffiliateCard({ card }: { card: AffiliateCardView }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void fetch("/api/affiliate/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: card.offerId,
        advertiserId: card.advertiserId,
        hostId: card.hostId,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [card.offerId, card.advertiserId, card.hostId]);

  const href = `/api/affiliate/go/${encodeURIComponent(card.offerId)}?host=${encodeURIComponent(card.hostId)}`;

  return (
    <aside className="w-full rounded-[1.5rem] bg-paper px-5 py-5 text-left text-ink">
      <p className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
        Sponsored
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight">{card.title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{card.body}</p>
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt=""
          className="mt-3 max-h-28 w-full rounded-2xl object-contain"
        />
      ) : null}
      <a
        href={href}
        rel="nofollow noopener"
        className="mt-5 flex h-14 w-full items-center justify-center rounded-full border border-ink/20 text-base font-semibold"
      >
        {card.ctaLabel}
      </a>
      <p className="mt-3 text-xs text-ink-soft">
        We may earn a commission if you make a purchase.
      </p>
    </aside>
  );
}

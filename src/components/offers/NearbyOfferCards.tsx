import { categoryLabel, offerTitle } from "@/lib/offer";
import type { NearbyOffer } from "@/lib/select-promotion";

function badge(
  item: NearbyOffer,
  blockedIds: string[],
  shownId: string | undefined,
) {
  if (blockedIds.includes(item.promotion.id)) {
    return { label: "Blocked", className: "bg-ink/10 text-ink-soft" };
  }
  if (item.promotion.id === shownId) {
    return { label: "Shown after rank", className: "bg-moss text-paper" };
  }
  return { label: "In range", className: "bg-ink/10 text-ink-soft" };
}

export function NearbyOfferCards({
  nearby,
  blockedIds = [],
}: {
  nearby: NearbyOffer[];
  blockedIds?: string[];
}) {
  if (nearby.length === 0) {
    return (
      <p className="mt-4 rounded-3xl border border-ink/10 px-5 py-5 text-ink-soft">
        None in range. The game still runs.
      </p>
    );
  }

  const shownId = nearby.find(
    (item) => !blockedIds.includes(item.promotion.id),
  )?.promotion.id;

  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {nearby.map((item) => {
        const tone = badge(item, blockedIds, shownId);
        return (
          <li
            key={item.promotion.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="text-sm">
              <span className={`rounded-full px-3 py-1 ${tone.className}`}>
                {tone.label}
              </span>
            </p>
            <h3 className="mt-3 font-display text-2xl">
              {offerTitle(item.promotion)}
            </h3>
            <p className="mt-2">{item.promotion.merchant.displayName}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {item.card.distanceLabel} · {categoryLabel(item.promotion.category)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {item.promotion.location.address}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

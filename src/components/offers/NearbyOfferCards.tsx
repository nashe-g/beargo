import { categoryLabel, offerTitle } from "@/lib/offer";
import type { NearbyOffer } from "@/lib/select-promotion";

export function NearbyOfferCards({ nearby }: { nearby: NearbyOffer[] }) {
  if (nearby.length === 0) {
    return (
      <p className="mt-4 rounded-3xl border border-ink/10 px-5 py-5 text-ink-soft">
        None in range. The game still runs.
      </p>
    );
  }

  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {nearby.map((item, index) => (
        <li
          key={item.promotion.id}
          className="rounded-3xl border border-ink/10 px-5 py-5"
        >
          <p className="text-sm text-ink-soft">
            {index === 0 ? (
              <span className="rounded-full bg-moss px-3 py-1 text-paper">
                Shown after rank
              </span>
            ) : (
              <span className="rounded-full bg-ink/10 px-3 py-1">
                In range
              </span>
            )}
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
      ))}
    </ul>
  );
}

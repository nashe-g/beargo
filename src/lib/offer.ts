export const BEARGO_FEE_CENTS = 100;

export const PROMOTION_CATEGORIES = [
  { id: "comedy", label: "Comedy" },
  { id: "concerts", label: "Concerts" },
  { id: "entertainment", label: "Entertainment" },
  { id: "attractions", label: "Attractions" },
  { id: "coffee", label: "Coffee" },
  { id: "bowling", label: "Bowling" },
  { id: "dinner", label: "Dinner" },
  { id: "rideshare", label: "Rideshare" },
  { id: "salons", label: "Salons" },
  { id: "local-services", label: "Local services" },
  { id: "bars", label: "Bars" },
  { id: "restaurants", label: "Restaurants" },
  { id: "nightlife", label: "Nightlife" },
] as const;

export type PromotionCategory = (typeof PROMOTION_CATEGORIES)[number]["id"];

export function categoryLabel(id: string) {
  return PROMOTION_CATEGORIES.find((row) => row.id === id)?.label ?? id;
}

export const OTHER_CATEGORY = "other";

export function resolvePromotionCategory(
  selected: string,
  otherText = "",
) {
  const allowed = new Set(PROMOTION_CATEGORIES.map((row) => row.id));
  if (selected !== OTHER_CATEGORY) {
    return allowed.has(selected as PromotionCategory)
      ? selected
      : null;
  }
  const text = otherText.trim().replace(/\s+/g, " ");
  if (text.length < 2 || text.length > 48) return null;
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const match = PROMOTION_CATEGORIES.find(
    (row) =>
      row.id === slug || row.label.toLowerCase() === text.toLowerCase(),
  );
  return match ? match.id : text;
}

export type DiscountType = "fixed" | "percentage";
export type TeaserMode = "merchant_hidden" | "merchant_visible";
export type PromotionStatus =
  | "draft"
  | "live"
  | "paused"
  | "ended"
  | "capped"
  | "cancelled";

export function promotionStatusLabel(status: PromotionStatus | string) {
  if (status === "cancelled") return "Canceled";
  if (status === "capped") return "Ended";
  if (status === "live") return "Live";
  if (status === "paused") return "Paused";
  if (status === "ended") return "Ended";
  if (status === "draft") return "Draft";
  return status.replaceAll("_", " ");
}

export function displayPromotionStatus(
  promotion: {
    status: PromotionStatus | string;
    endsAt?: Date | string | null;
  },
  at = new Date(),
): PromotionStatus {
  if (promotion.status === "cancelled") return "cancelled";
  if (promotion.status === "ended" || promotion.status === "capped") {
    return "ended";
  }
  const end = promotion.endsAt ? new Date(promotion.endsAt).getTime() : null;
  if (end != null && end <= at.getTime()) return "ended";
  return promotion.status as PromotionStatus;
}

export function canCancelPromotion(status: PromotionStatus | string) {
  return status === "live" || status === "paused" || status === "draft";
}

export function offerAcceptsNewClaims(
  promotion: {
    status: PromotionStatus | string;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
  },
  at = new Date(),
) {
  if (promotion.status !== "live") return false;
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > at.getTime()) {
    return false;
  }
  if (promotion.endsAt && new Date(promotion.endsAt).getTime() <= at.getTime()) {
    return false;
  }
  return true;
}

export type VoucherStatus =
  | "claimed"
  | "redeemed"
  | "expired"
  | "cancelled"
  | "invalid";

export function formatFixedOff(cents: number) {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars} off`;
  return `$${(cents / 100).toFixed(2)} off`;
}

export function formatPercentOff(percent: number) {
  return `${percent}% off`;
}

export function valueHeadline(input: {
  discountType: DiscountType;
  discountAmountCents?: number | null;
  discountPercent?: number | null;
}) {
  if (input.discountType === "percentage") {
    return formatPercentOff(input.discountPercent ?? 0).toUpperCase();
  }
  const cents = input.discountAmountCents ?? 0;
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars} OFF`;
  return `$${(cents / 100).toFixed(2)} OFF`;
}

export function offerTitle(input: {
  discountType: DiscountType;
  discountAmountCents?: number | null;
  discountPercent?: number | null;
  minimumPurchaseCents: number;
  maxDiscountCents?: number | null;
}) {
  const min = input.minimumPurchaseCents / 100;
  const minLabel = Number.isInteger(min) ? `$${min}` : `$${min.toFixed(2)}`;
  if (input.discountType === "percentage") {
    const base = `${input.discountPercent ?? 0}% off ${minLabel}+`;
    if (input.maxDiscountCents) {
      const cap = input.maxDiscountCents / 100;
      const capLabel = Number.isInteger(cap) ? `$${cap}` : `$${cap.toFixed(2)}`;
      return `${base} — up to ${capLabel} off`;
    }
    return base;
  }
  const amount = (input.discountAmountCents ?? 0) / 100;
  const amountLabel = Number.isInteger(amount)
    ? `$${amount}`
    : `$${amount.toFixed(2)}`;
  return `${amountLabel} off ${minLabel}+`;
}

export function discountForSubtotal(input: {
  discountType: DiscountType;
  discountAmountCents?: number | null;
  discountPercent?: number | null;
  minimumPurchaseCents: number;
  maxDiscountCents?: number | null;
  subtotalCents: number;
}) {
  if (input.subtotalCents < input.minimumPurchaseCents) {
    return { ok: false as const, discountCents: 0 };
  }
  if (input.discountType === "fixed") {
    return {
      ok: true as const,
      discountCents: Math.min(
        input.discountAmountCents ?? 0,
        input.subtotalCents,
      ),
    };
  }
  const raw = Math.round(
    (input.subtotalCents * (input.discountPercent ?? 0)) / 100,
  );
  const capped =
    input.maxDiscountCents == null
      ? raw
      : Math.min(raw, input.maxDiscountCents);
  return {
    ok: true as const,
    discountCents: Math.min(capped, input.subtotalCents),
  };
}

export function formatApplyDiscount(cents: number) {
  return `Apply $${(cents / 100).toFixed(2)} discount`;
}

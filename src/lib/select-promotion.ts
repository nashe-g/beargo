import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { vouchers } from "@/db/schema";
import { formatDistance, milesBetween } from "@/lib/geo";
import type { HostRecord } from "@/lib/hosts";
import {
  categoryLabel,
  offerTitle,
  valueHeadline,
} from "@/lib/offer";
import {
  listPromotions,
  remainingRedemptions,
  type PromotionRecord,
} from "@/lib/promotions";
import { localParts, urgencyCopy } from "@/lib/zoned";

export type OfferCard = {
  promotionId: string;
  merchantId: string;
  merchantName: string;
  locationName: string;
  address: string;
  category: string;
  categoryLabel: string;
  teaserMode: PromotionRecord["teaserMode"];
  valueHeadline: string;
  offerTitle: string;
  distanceMiles: number | null;
  distanceLabel: string | null;
  urgency: string;
  shortTerms: string;
  restrictions: string | null;
  minimumPurchaseCents: number;
  teaserCta: string;
  revealCta: string;
};

function hostAllows(host: HostRecord, promotion: PromotionRecord) {
  if (host.excludedMerchantIds.includes(promotion.merchantId)) return false;
  if (host.excludedCategories.includes(promotion.category)) return false;
  if (host.excludedCategories.includes(promotion.merchant.category)) return false;
  if (
    promotion.eligibleHostIds.length > 0 &&
    !promotion.eligibleHostIds.includes(host.id)
  ) {
    return false;
  }
  return true;
}

function inWindow(promotion: PromotionRecord, at: Date) {
  if (promotion.startsAt && promotion.startsAt.getTime() > at.getTime()) {
    return false;
  }
  if (promotion.endsAt && promotion.endsAt.getTime() < at.getTime()) {
    return false;
  }
  const parts = localParts(promotion.location.timezone, at);
  if (!promotion.validWeekdays.includes(parts.weekday)) return false;
  if (parts.minutes < promotion.validMinutesStart) return false;
  if (parts.minutes > promotion.validMinutesEnd) return false;
  return true;
}

function compelling(card: OfferCard) {
  const parts = [
    Boolean(card.valueHeadline),
    Boolean(card.distanceLabel),
    Boolean(card.urgency),
    Boolean(card.categoryLabel),
  ].filter(Boolean).length;
  return parts >= 3;
}

export async function toOfferCard(
  promotion: PromotionRecord,
  host: HostRecord,
  at = new Date(),
): Promise<OfferCard | null> {
  if (host.lat == null || host.lng == null) return null;
  const miles = milesBetween(
    { lat: host.lat, lng: host.lng },
    { lat: promotion.location.lat, lng: promotion.location.lng },
  );
  if (miles > promotion.radiusMiles) return null;

  const hidden = promotion.teaserMode === "merchant_hidden";
  const card: OfferCard = {
    promotionId: promotion.id,
    merchantId: promotion.merchantId,
    merchantName: promotion.merchant.displayName,
    locationName: promotion.location.name,
    address: promotion.location.address,
    category: promotion.category,
    categoryLabel: categoryLabel(promotion.category),
    teaserMode: promotion.teaserMode,
    valueHeadline: valueHeadline(promotion),
    offerTitle: offerTitle(promotion),
    distanceMiles: miles,
    distanceLabel: formatDistance(miles),
    urgency: urgencyCopy({
      timeZone: promotion.location.timezone,
      validMinutesEnd: promotion.validMinutesEnd,
      at,
    }),
    shortTerms: promotion.shortTerms,
    restrictions: promotion.restrictions ?? null,
    minimumPurchaseCents: promotion.minimumPurchaseCents,
    teaserCta: hidden ? "SEE WHERE" : "VIEW OFFER",
    revealCta: "CLAIM FREE",
  };
  if (!compelling(card)) return null;
  return card;
}

export type NearbyOffer = {
  promotion: PromotionRecord;
  card: OfferCard;
  miles: number;
};

export async function listNearbyOffersForHost(
  host: HostRecord,
  extra: { deviceKey?: string | null; at?: Date } = {},
): Promise<NearbyOffer[]> {
  const at = extra.at ?? new Date();
  const all = await listPromotions();
  const live = all.filter(
    (promotion) =>
      promotion.status === "live" &&
      promotion.merchant.status === "active" &&
      promotion.location.status === "active",
  );

  const scored: NearbyOffer[] = [];

  for (const promotion of live) {
    if (!hostAllows(host, promotion)) continue;
    if (!inWindow(promotion, at)) continue;
    const remaining = await remainingRedemptions(promotion);
    if (remaining <= 0) continue;
    if (extra.deviceKey) {
      const [existing] = await db()
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.promotionId, promotion.id),
            eq(vouchers.deviceKey, extra.deviceKey),
            eq(vouchers.status, "claimed"),
          ),
        )
        .limit(1);
      if (existing) continue;
    }
    const card = await toOfferCard(promotion, host, at);
    if (!card || card.distanceMiles == null) continue;
    scored.push({ promotion, card, miles: card.distanceMiles });
  }

  scored.sort((a, b) => a.miles - b.miles);
  return scored;
}

export async function selectPromotionForHost(
  host: HostRecord,
  extra: { deviceKey?: string | null; at?: Date } = {},
) {
  const nearby = await listNearbyOffersForHost(host, extra);
  return nearby[0] ?? null;
}

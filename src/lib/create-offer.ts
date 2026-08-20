import { centsFromDollars } from "@/lib/money";
import {
  type DiscountType,
  type PromotionStatus,
  type TeaserMode,
  resolvePromotionCategory,
} from "@/lib/offer";
import {
  upsertLocation,
  upsertPromotion,
  type MerchantLocationRecord,
  type MerchantRecord,
  type PromotionRecord,
} from "@/lib/promotions";
import { parseZonedDateTime } from "@/lib/zoned";

export type OfferDraft = {
  category?: string;
  categoryOther?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
  minimumPurchase?: number;
  maxDiscount?: number;
  radiusMiles?: number;
  endDate?: string;
  endTime?: string;
  teaserMode?: TeaserMode;
  shortTerms?: string;
};

export async function createOffer(input: {
  merchant: MerchantRecord;
  draft: OfferDraft;
  testMode: boolean;
  status: Extract<PromotionStatus, "live" | "pending">;
  lockedLocation?: MerchantLocationRecord;
}): Promise<{ promotion: PromotionRecord } | { error: string; status: number }> {
  const category = input.lockedLocation
    ? input.merchant.category
    : resolvePromotionCategory(
        String(input.draft.category ?? "entertainment"),
        String(input.draft.categoryOther ?? ""),
      );
  if (!category) {
    return {
      error: "Pick a category, or type one under Other.",
      status: 400,
    };
  }

  const discountType: DiscountType =
    input.draft.discountType === "percentage" ? "percentage" : "fixed";
  const minimumPurchaseCents = centsFromDollars(
    Number(input.draft.minimumPurchase ?? 0),
  );
  if (minimumPurchaseCents <= 0) {
    return { error: "Minimum purchase required", status: 400 };
  }

  let location = input.lockedLocation ?? null;
  if (!location) {
    const address = String(input.draft.address ?? "").trim();
    const lat = Number(input.draft.lat);
    const lng = Number(input.draft.lng);
    if (!address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { error: "Address and coordinates required", status: 400 };
    }
    location = await upsertLocation({
      merchantId: input.merchant.id,
      name: input.merchant.displayName,
      address,
      city: String(input.draft.city ?? "Houston"),
      neighborhood: input.draft.neighborhood || null,
      lat,
      lng,
    });
  }

  const endsAt = parseZonedDateTime(
    location.timezone,
    String(input.draft.endDate ?? ""),
    String(input.draft.endTime ?? ""),
  );
  if (!endsAt) {
    return { error: "Pick an offer end date and time.", status: 400 };
  }
  if (endsAt.getTime() <= Date.now()) {
    return { error: "Offer end must be in the future.", status: 400 };
  }

  const promotion = await upsertPromotion({
    merchantId: input.merchant.id,
    locationId: location.id,
    status: input.status,
    discountType,
    discountAmountCents:
      discountType === "fixed"
        ? centsFromDollars(Number(input.draft.discountAmount ?? 0))
        : null,
    discountPercent:
      discountType === "percentage"
        ? Number(input.draft.discountPercent ?? 0)
        : null,
    minimumPurchaseCents,
    maxDiscountCents:
      discountType === "percentage" && Number(input.draft.maxDiscount)
        ? centsFromDollars(Number(input.draft.maxDiscount))
        : null,
    category,
    teaserMode:
      input.draft.teaserMode === "merchant_visible"
        ? "merchant_visible"
        : "merchant_hidden",
    shortTerms: String(input.draft.shortTerms ?? "").trim(),
    radiusMiles: Number(input.draft.radiusMiles ?? 1.5) || 1.5,
    startsAt: new Date(),
    endsAt,
    testMode: input.testMode,
  });
  return { promotion };
}

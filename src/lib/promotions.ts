import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  merchantLocations,
  merchants,
  promotionHosts,
  promotions,
  vouchers,
} from "@/db/schema";
import { dollarsFromCents } from "@/lib/money";
import {
  BEARGO_FEE_CENTS,
  type DiscountType,
  type PromotionStatus,
  type TeaserMode,
} from "@/lib/offer";
import { slugify } from "@/lib/slug";

export type MerchantRecord = {
  id: string;
  displayName: string;
  category: string;
  logoUrl?: string | null;
  status: string;
  billingEnabled: boolean;
};

export type MerchantLocationRecord = {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  city: string;
  neighborhood?: string | null;
  lat: number;
  lng: number;
  timezone: string;
  status: string;
};

export type PromotionRecord = {
  id: string;
  merchantId: string;
  locationId: string;
  status: PromotionStatus;
  discountType: DiscountType;
  discountAmountCents: number | null;
  discountPercent: number | null;
  minimumPurchaseCents: number;
  maxDiscountCents: number | null;
  category: string;
  teaserMode: TeaserMode;
  shortTerms: string;
  restrictions?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  validWeekdays: number[];
  validMinutesStart: number;
  validMinutesEnd: number;
  voucherExpireHour: number;
  maxRedemptions: number | null;
  radiusMiles: number;
  testMode: boolean;
  eligibleHostIds: string[];
  merchant: MerchantRecord;
  location: MerchantLocationRecord;
};

export const DEMO_MERCHANT_ID = "the-riot";

function mapMerchant(row: typeof merchants.$inferSelect): MerchantRecord {
  return {
    id: row.id,
    displayName: row.displayName,
    category: row.category,
    logoUrl: row.logoUrl,
    status: row.status,
    billingEnabled: row.billingEnabled,
  };
}

function mapLocation(
  row: typeof merchantLocations.$inferSelect,
): MerchantLocationRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    name: row.name,
    address: row.address,
    city: row.city,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    timezone: row.timezone,
    status: row.status,
  };
}

export async function listMerchants() {
  const rows = await db().select().from(merchants).orderBy(merchants.displayName);
  return rows.map(mapMerchant);
}

export async function getMerchant(id: string) {
  const [row] = await db()
    .select()
    .from(merchants)
    .where(eq(merchants.id, id))
    .limit(1);
  return row ? mapMerchant(row) : null;
}

export async function upsertMerchant(input: {
  id?: string;
  displayName: string;
  category: string;
  logoUrl?: string | null;
  status?: string;
  billingEnabled?: boolean;
}) {
  const id = input.id || slugify(input.displayName);
  await db()
    .insert(merchants)
    .values({
      id,
      displayName: input.displayName,
      category: input.category,
      logoUrl: input.logoUrl ?? null,
      status: input.status ?? "active",
      billingEnabled: input.billingEnabled ?? true,
    })
    .onConflictDoUpdate({
      target: merchants.id,
      set: {
        displayName: input.displayName,
        category: input.category,
        logoUrl: input.logoUrl ?? null,
        status: input.status ?? "active",
        billingEnabled: input.billingEnabled ?? true,
      },
    });
  return (await getMerchant(id))!;
}

export async function listLocations(merchantId?: string) {
  const rows = merchantId
    ? await db()
        .select()
        .from(merchantLocations)
        .where(eq(merchantLocations.merchantId, merchantId))
    : await db().select().from(merchantLocations);
  return rows.map(mapLocation);
}

export async function getLocation(id: string) {
  const [row] = await db()
    .select()
    .from(merchantLocations)
    .where(eq(merchantLocations.id, id))
    .limit(1);
  return row ? mapLocation(row) : null;
}

export async function upsertLocation(input: {
  id?: string;
  merchantId: string;
  name: string;
  address: string;
  city?: string;
  neighborhood?: string | null;
  lat: number;
  lng: number;
  timezone?: string;
  status?: string;
}) {
  const id = input.id || `${input.merchantId}-${slugify(input.name)}`;
  await db()
    .insert(merchantLocations)
    .values({
      id,
      merchantId: input.merchantId,
      name: input.name,
      address: input.address,
      city: input.city ?? "Houston",
      neighborhood: input.neighborhood ?? null,
      lat: input.lat,
      lng: input.lng,
      timezone: input.timezone ?? "America/Chicago",
      status: input.status ?? "active",
    })
    .onConflictDoUpdate({
      target: merchantLocations.id,
      set: {
        name: input.name,
        address: input.address,
        city: input.city ?? "Houston",
        neighborhood: input.neighborhood ?? null,
        lat: input.lat,
        lng: input.lng,
        timezone: input.timezone ?? "America/Chicago",
        status: input.status ?? "active",
      },
    });
  return (await getLocation(id))!;
}

async function hydratePromotion(
  row: typeof promotions.$inferSelect,
): Promise<PromotionRecord | null> {
  const [merchant, location, hostRows] = await Promise.all([
    getMerchant(row.merchantId),
    getLocation(row.locationId),
    db()
      .select()
      .from(promotionHosts)
      .where(eq(promotionHosts.promotionId, row.id)),
  ]);
  if (!merchant || !location) return null;
  return {
    id: row.id,
    merchantId: row.merchantId,
    locationId: row.locationId,
    status: row.status as PromotionStatus,
    discountType: row.discountType as DiscountType,
    discountAmountCents: row.discountAmountCents,
    discountPercent: row.discountPercent,
    minimumPurchaseCents: row.minimumPurchaseCents,
    maxDiscountCents: row.maxDiscountCents,
    category: row.category,
    teaserMode: row.teaserMode as TeaserMode,
    shortTerms: row.shortTerms,
    restrictions: row.restrictions,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    validWeekdays: row.validWeekdays,
    validMinutesStart: row.validMinutesStart,
    validMinutesEnd: row.validMinutesEnd,
    voucherExpireHour: row.voucherExpireHour,
    maxRedemptions: row.maxRedemptions,
    radiusMiles: row.radiusMiles,
    testMode: row.testMode,
    eligibleHostIds: hostRows.map((item) => item.hostId),
    merchant,
    location,
  };
}

export async function listPromotions(merchantId?: string) {
  const rows = merchantId
    ? await db()
        .select()
        .from(promotions)
        .where(eq(promotions.merchantId, merchantId))
        .orderBy(desc(promotions.createdAt))
    : await db().select().from(promotions).orderBy(desc(promotions.createdAt));
  const hydrated = await Promise.all(rows.map(hydratePromotion));
  return hydrated.filter((row): row is PromotionRecord => Boolean(row));
}

export async function getPromotion(id: string) {
  const [row] = await db()
    .select()
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);
  return row ? hydratePromotion(row) : null;
}

export async function setPromotionHosts(promotionId: string, hostIds: string[]) {
  await db()
    .delete(promotionHosts)
    .where(eq(promotionHosts.promotionId, promotionId));
  if (hostIds.length === 0) return;
  await db()
    .insert(promotionHosts)
    .values(hostIds.map((hostId) => ({ promotionId, hostId })))
    .onConflictDoNothing();
}

export async function upsertPromotion(input: {
  id?: string;
  merchantId: string;
  locationId: string;
  status?: PromotionStatus;
  discountType: DiscountType;
  discountAmountCents?: number | null;
  discountPercent?: number | null;
  minimumPurchaseCents: number;
  maxDiscountCents?: number | null;
  category: string;
  teaserMode?: TeaserMode;
  shortTerms?: string;
  restrictions?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  validWeekdays?: number[];
  validMinutesStart?: number;
  validMinutesEnd?: number;
  voucherExpireHour?: number;
  radiusMiles?: number;
  testMode?: boolean;
  eligibleHostIds?: string[];
}) {
  const id = input.id || randomUUID();
  await db()
    .insert(promotions)
    .values({
      id,
      merchantId: input.merchantId,
      locationId: input.locationId,
      status: input.status ?? "paused",
      discountType: input.discountType,
      discountAmountCents: input.discountAmountCents ?? null,
      discountPercent: input.discountPercent ?? null,
      minimumPurchaseCents: input.minimumPurchaseCents,
      maxDiscountCents: input.maxDiscountCents ?? null,
      category: input.category,
      teaserMode: input.teaserMode ?? "merchant_hidden",
      shortTerms: input.shortTerms ?? "",
      restrictions: input.restrictions ?? null,
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt ?? null,
      validWeekdays: input.validWeekdays ?? [0, 1, 2, 3, 4, 5, 6],
      validMinutesStart: input.validMinutesStart ?? 0,
      validMinutesEnd: input.validMinutesEnd ?? 24 * 60 - 1,
      voucherExpireHour: input.voucherExpireHour ?? 1,
      maxRedemptions: null,
      radiusMiles: input.radiusMiles ?? 1.5,
      testMode: input.testMode ?? false,
    })
    .onConflictDoUpdate({
      target: promotions.id,
      set: {
        locationId: input.locationId,
        status: input.status ?? "paused",
        discountType: input.discountType,
        discountAmountCents: input.discountAmountCents ?? null,
        discountPercent: input.discountPercent ?? null,
        minimumPurchaseCents: input.minimumPurchaseCents,
        maxDiscountCents: input.maxDiscountCents ?? null,
        category: input.category,
        teaserMode: input.teaserMode ?? "merchant_hidden",
        shortTerms: input.shortTerms ?? "",
        restrictions: input.restrictions ?? null,
        startsAt: input.startsAt ?? new Date(),
        endsAt: input.endsAt ?? null,
        validWeekdays: input.validWeekdays ?? [0, 1, 2, 3, 4, 5, 6],
        validMinutesStart: input.validMinutesStart ?? 0,
        validMinutesEnd: input.validMinutesEnd ?? 24 * 60 - 1,
        voucherExpireHour: input.voucherExpireHour ?? 1,
        maxRedemptions: null,
        radiusMiles: input.radiusMiles ?? 1.5,
        testMode: input.testMode ?? false,
      },
    });
  if (input.eligibleHostIds) {
    await setPromotionHosts(id, input.eligibleHostIds);
  }
  return (await getPromotion(id))!;
}

export async function patchPromotionStatus(id: string, status: PromotionStatus) {
  await db().update(promotions).set({ status }).where(eq(promotions.id, id));
  return getPromotion(id);
}

export async function cancelPromotion(id: string) {
  const current = await getPromotion(id);
  if (!current) return null;
  if (current.status === "cancelled" || current.status === "ended") {
    return current;
  }
  return patchPromotionStatus(id, "cancelled");
}

export async function redemptionCount(promotionId: string) {
  const [row] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(vouchers)
    .where(
      and(eq(vouchers.promotionId, promotionId), eq(vouchers.status, "redeemed")),
    );
  return row?.count ?? 0;
}

export async function remainingRedemptions(promotion: PromotionRecord) {
  if (promotion.maxRedemptions == null) return Infinity;
  const used = await redemptionCount(promotion.id);
  return Math.max(0, promotion.maxRedemptions - used);
}

export function remainingBudgetDollars(promotion: PromotionRecord, redeemed: number) {
  if (promotion.maxRedemptions == null) return null;
  return dollarsFromCents((promotion.maxRedemptions - redeemed) * BEARGO_FEE_CENTS);
}

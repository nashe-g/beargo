import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  affiliateAdvertisers,
  affiliateEvents,
  affiliateOffers,
} from "@/db/schema";
import { AFFILIATE_POSTGAME_ENABLED } from "@/lib/config";
import { slugify } from "@/lib/slug";

export const AFFILIATE_PLACEMENT = "post_game_leaderboard";

export type AffiliateAdvertiser = {
  id: string;
  network: string;
  networkAdvertiserId: string | null;
  name: string;
  relationshipStatus: string;
  serviceableCountries: string[];
  termsReviewedAt: Date | null;
  active: boolean;
};

export type AffiliateOffer = {
  id: string;
  advertiserId: string;
  network: string;
  offerType: string;
  title: string;
  body: string;
  ctaLabel: string;
  affiliateClickUrl: string;
  advertiserDestination: string | null;
  imageUrl: string | null;
  sourceLinkId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  targetCountries: string[];
  adminWeight: number;
  complianceReviewed: boolean;
  active: boolean;
};

let tablesReady = false;

export async function ensureAffiliateTables() {
  if (tablesReady) return;
  await db().execute(sql`
    CREATE TABLE IF NOT EXISTS affiliate_advertisers (
      id text PRIMARY KEY,
      network text NOT NULL DEFAULT 'CJ',
      network_advertiser_id text,
      name text NOT NULL,
      relationship_status text NOT NULL DEFAULT 'pending',
      serviceable_countries jsonb NOT NULL DEFAULT '["US"]'::jsonb,
      terms_reviewed_at timestamptz,
      active boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS affiliate_offers (
      id text PRIMARY KEY,
      advertiser_id text NOT NULL REFERENCES affiliate_advertisers(id),
      network text NOT NULL DEFAULT 'CJ',
      offer_type text NOT NULL DEFAULT 'advertiser_landing',
      title text NOT NULL,
      body text NOT NULL,
      cta_label text NOT NULL,
      affiliate_click_url text NOT NULL,
      advertiser_destination text,
      image_url text,
      source_link_id text,
      source_product_id text,
      starts_at timestamptz,
      ends_at timestamptz,
      target_countries jsonb NOT NULL DEFAULT '["US"]'::jsonb,
      admin_weight integer NOT NULL DEFAULT 1,
      compliance_reviewed boolean NOT NULL DEFAULT false,
      active boolean NOT NULL DEFAULT false,
      last_verified_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS affiliate_events (
      id text PRIMARY KEY,
      kind text NOT NULL,
      placement text NOT NULL DEFAULT 'post_game_leaderboard',
      offer_id text NOT NULL,
      advertiser_id text NOT NULL,
      host_id text,
      country text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  tablesReady = true;
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function mapAdvertiser(
  row: typeof affiliateAdvertisers.$inferSelect,
): AffiliateAdvertiser {
  return {
    id: row.id,
    network: row.network,
    networkAdvertiserId: row.networkAdvertiserId,
    name: row.name,
    relationshipStatus: row.relationshipStatus,
    serviceableCountries: row.serviceableCountries ?? ["US"],
    termsReviewedAt: row.termsReviewedAt,
    active: row.active,
  };
}

function mapOffer(row: typeof affiliateOffers.$inferSelect): AffiliateOffer {
  return {
    id: row.id,
    advertiserId: row.advertiserId,
    network: row.network,
    offerType: row.offerType,
    title: row.title,
    body: row.body,
    ctaLabel: row.ctaLabel,
    affiliateClickUrl: row.affiliateClickUrl,
    advertiserDestination: row.advertiserDestination,
    imageUrl: row.imageUrl,
    sourceLinkId: row.sourceLinkId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    targetCountries: row.targetCountries ?? ["US"],
    adminWeight: row.adminWeight,
    complianceReviewed: row.complianceReviewed,
    active: row.active,
  };
}

export async function listAffiliateAdvertisers() {
  await ensureAffiliateTables();
  const rows = await db()
    .select()
    .from(affiliateAdvertisers)
    .orderBy(desc(affiliateAdvertisers.createdAt));
  return rows.map(mapAdvertiser);
}

export async function listAffiliateOffers() {
  await ensureAffiliateTables();
  const rows = await db()
    .select()
    .from(affiliateOffers)
    .orderBy(desc(affiliateOffers.createdAt));
  return rows.map(mapOffer);
}

function offerInWindow(offer: AffiliateOffer, at: Date) {
  if (offer.startsAt && offer.startsAt.getTime() > at.getTime()) return false;
  if (offer.endsAt && offer.endsAt.getTime() < at.getTime()) return false;
  return true;
}

function countryAllowed(allowed: string[], country: string) {
  if (allowed.length === 0) return true;
  return allowed.includes(country);
}

export function offerIsEligible(
  offer: AffiliateOffer,
  advertiser: AffiliateAdvertiser,
  country: string,
  at = new Date(),
) {
  if (!offer.active || !advertiser.active) return false;
  if (advertiser.relationshipStatus !== "joined") return false;
  if (!offer.complianceReviewed) return false;
  if (!isHttpsUrl(offer.affiliateClickUrl)) return false;
  if (!offerInWindow(offer, at)) return false;
  if (!countryAllowed(offer.targetCountries, country)) return false;
  if (!countryAllowed(advertiser.serviceableCountries, country)) return false;
  return true;
}

export function affiliateSid(offerId: string, hostId?: string | null) {
  const offer = offerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  const host = hostId
    ? hostId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
    : "";
  return host ? `lb_v1_o${offer}_h${host}` : `lb_v1_o${offer}`;
}

export function clickUrlWithSid(clickUrl: string, sid: string) {
  const url = new URL(clickUrl);
  if (!url.searchParams.has("sid") && !url.searchParams.has("SID")) {
    url.searchParams.set("sid", sid);
  }
  return url.toString();
}

export async function getEligibleOfferById(input: {
  offerId: string;
  country?: string;
}) {
  if (!AFFILIATE_POSTGAME_ENABLED) return null;
  await ensureAffiliateTables();
  const [offerRow] = await db()
    .select()
    .from(affiliateOffers)
    .where(eq(affiliateOffers.id, input.offerId))
    .limit(1);
  if (!offerRow) return null;
  const [advertiserRow] = await db()
    .select()
    .from(affiliateAdvertisers)
    .where(eq(affiliateAdvertisers.id, offerRow.advertiserId))
    .limit(1);
  if (!advertiserRow) return null;
  const offer = mapOffer(offerRow);
  const advertiser = mapAdvertiser(advertiserRow);
  const country = (input.country ?? "US").toUpperCase();
  if (!offerIsEligible(offer, advertiser, country)) return null;
  return { offer, advertiser };
}

export async function resolveAffiliateClick(input: {
  offerId: string;
  hostId?: string | null;
  country?: string;
}) {
  const live = await getEligibleOfferById(input);
  if (!live) return null;
  return {
    url: clickUrlWithSid(
      live.offer.affiliateClickUrl,
      affiliateSid(live.offer.id, input.hostId),
    ),
    offer: live.offer,
    advertiser: live.advertiser,
  };
}

export async function recordAffiliateEvent(input: {
  kind: "impression" | "click";
  offerId: string;
  advertiserId: string;
  hostId?: string | null;
  country?: string;
  placement?: string;
}) {
  await ensureAffiliateTables();
  await db().insert(affiliateEvents).values({
    id: randomUUID(),
    kind: input.kind,
    placement: input.placement || AFFILIATE_PLACEMENT,
    offerId: input.offerId,
    advertiserId: input.advertiserId,
    hostId: input.hostId ?? null,
    country: input.country ?? "US",
  });
}

export async function affiliateEventCounts() {
  await ensureAffiliateTables();
  const rows = await db().select().from(affiliateEvents);
  const byOffer = new Map<string, { impressions: number; clicks: number }>();
  for (const row of rows) {
    const current = byOffer.get(row.offerId) ?? { impressions: 0, clicks: 0 };
    if (row.kind === "impression") current.impressions += 1;
    if (row.kind === "click") current.clicks += 1;
    byOffer.set(row.offerId, current);
  }
  return byOffer;
}

export async function createAffiliateAdvertiser(input: {
  name: string;
  networkAdvertiserId?: string;
  relationshipStatus: string;
  serviceableCountries?: string[];
  active: boolean;
}) {
  await ensureAffiliateTables();
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Advertiser name required." };
  const id = `${slugify(name)}-${randomUUID().slice(0, 6)}`;
  await db().insert(affiliateAdvertisers).values({
    id,
    name,
    network: "CJ",
    networkAdvertiserId: input.networkAdvertiserId?.trim() || null,
    relationshipStatus: input.relationshipStatus,
    serviceableCountries: input.serviceableCountries ?? ["US"],
    termsReviewedAt:
      input.relationshipStatus === "joined" ? new Date() : null,
    active: input.active,
  });
  return { ok: true as const, id };
}

export async function createAffiliateOffer(input: {
  advertiserId: string;
  title: string;
  body: string;
  ctaLabel: string;
  affiliateClickUrl: string;
  advertiserDestination?: string;
  imageUrl?: string;
  sourceLinkId?: string;
  startsAt?: string;
  endsAt?: string;
  targetCountries?: string[];
  adminWeight?: number;
  complianceReviewed: boolean;
  active: boolean;
}) {
  await ensureAffiliateTables();
  const title = input.title.trim();
  const body = input.body.trim();
  const ctaLabel = input.ctaLabel.trim();
  const clickUrl = input.affiliateClickUrl.trim();
  if (!title || !body || !ctaLabel) {
    return { ok: false as const, error: "Title, body, and CTA are required." };
  }
  if (!isHttpsUrl(clickUrl)) {
    return { ok: false as const, error: "Click URL must be https." };
  }
  if (input.imageUrl && !isHttpsUrl(input.imageUrl)) {
    return { ok: false as const, error: "Image URL must be https." };
  }
  const [advertiser] = await db()
    .select()
    .from(affiliateAdvertisers)
    .where(eq(affiliateAdvertisers.id, input.advertiserId))
    .limit(1);
  if (!advertiser) return { ok: false as const, error: "Unknown advertiser." };
  const id = `${slugify(title).slice(0, 32)}-${randomUUID().slice(0, 6)}`;
  await db().insert(affiliateOffers).values({
    id,
    advertiserId: input.advertiserId,
    network: "CJ",
    title,
    body,
    ctaLabel,
    affiliateClickUrl: clickUrl,
    advertiserDestination: input.advertiserDestination?.trim() || null,
    imageUrl: input.imageUrl?.trim() || null,
    sourceLinkId: input.sourceLinkId?.trim() || null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    targetCountries: input.targetCountries ?? ["US"],
    adminWeight: Math.max(1, input.adminWeight ?? 1),
    complianceReviewed: input.complianceReviewed,
    active: input.active,
    lastVerifiedAt: new Date(),
  });
  return { ok: true as const, id };
}

export async function setAffiliateOfferActive(id: string, active: boolean) {
  await ensureAffiliateTables();
  await db()
    .update(affiliateOffers)
    .set({ active, updatedAt: new Date() })
    .where(eq(affiliateOffers.id, id));
}

export async function setAffiliateAdvertiserStatus(input: {
  id: string;
  active?: boolean;
  relationshipStatus?: string;
}) {
  await ensureAffiliateTables();
  await db()
    .update(affiliateAdvertisers)
    .set({
      ...(input.active == null ? {} : { active: input.active }),
      ...(input.relationshipStatus
        ? { relationshipStatus: input.relationshipStatus }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(affiliateAdvertisers.id, input.id));
}

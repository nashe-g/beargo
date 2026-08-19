import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  challengeSets,
  hosts,
  merchantLocations,
  merchants,
  paws,
  promotions,
  questions,
  users,
} from "./schema";
import { normalizeEmail } from "../lib/normalize";
import { SEED_QUESTIONS } from "../lib/questions";

const url =
  process.env.DATABASE_URL || "postgresql://beargo:beargo@localhost:5432/beargo";

const client = postgres(url, {
  max: 1,
  prepare: false,
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : true,
});
const db = drizzle(client);

const HOSTS = [
  {
    id: "the-rustic",
    displayName: "The Rustic",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Washington Avenue",
    address: "1836 Washington Ave, Houston, TX 77007",
    type: "venue",
    lat: 29.7705,
    lng: -95.3975,
    excludedCategories: ["bars", "restaurants", "nightlife"],
    excludedMerchantIds: [] as string[],
  },
  {
    id: "the-quiet-room",
    displayName: "The Quiet Room",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Montrose",
    address: "4317 Montrose Blvd, Houston, TX 77006",
    type: "venue",
    lat: 29.7472,
    lng: -95.3908,
    excludedCategories: [] as string[],
    excludedMerchantIds: [] as string[],
  },
  {
    id: "rice-union",
    displayName: "Rice Union",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Rice Village",
    address: "6100 Main St, Houston, TX 77005",
    type: "campus",
    lat: 29.716,
    lng: -95.409,
    excludedCategories: [] as string[],
    excludedMerchantIds: [] as string[],
  },
];

const PAWS = [
  { token: "demo", hostId: "the-rustic", placementLabel: "Bar top" },
  { token: "quiet", hostId: "the-quiet-room", placementLabel: "Front table" },
];

const MERCHANTS = [
  {
    id: "the-riot",
    displayName: "The Riot Comedy Club",
    category: "comedy",
    billingEnabled: true,
  },
  {
    id: "eastside-coffee",
    displayName: "Eastside Coffee",
    category: "coffee",
    billingEnabled: true,
  },
];

const LOCATIONS = [
  {
    id: "the-riot-main",
    merchantId: "the-riot",
    name: "The Riot Comedy Club",
    address: "1816 Thompson St, Houston",
    city: "Houston",
    neighborhood: "Washington Avenue",
    lat: 29.7639,
    lng: -95.3905,
    timezone: "America/Chicago",
  },
  {
    id: "eastside-coffee-montrose",
    merchantId: "eastside-coffee",
    name: "Eastside Coffee",
    address: "4317 Montrose Blvd, Houston",
    city: "Houston",
    neighborhood: "Montrose",
    lat: 29.7368,
    lng: -95.3914,
    timezone: "America/Chicago",
  },
];

const PROMOTIONS = [
  {
    id: "riot-10-off-30",
    merchantId: "the-riot",
    locationId: "the-riot-main",
    status: "live",
    discountType: "fixed",
    discountAmountCents: 1000,
    discountPercent: null as number | null,
    minimumPurchaseCents: 3000,
    maxDiscountCents: null as number | null,
    category: "comedy",
    teaserMode: "merchant_hidden",
    shortTerms: "$10 off a $30+ ticket or tab. Show your BearGo voucher at the door.",
    restrictions: "One voucher per person. Not valid with other offers.",
    validWeekdays: [0, 1, 2, 3, 4, 5, 6],
    validMinutesStart: 0,
    validMinutesEnd: 24 * 60 - 1,
    voucherExpireHour: 1,
    maxRedemptions: 200,
    radiusMiles: 1.5,
    testMode: true,
  },
  {
    id: "eastside-20-off",
    merchantId: "eastside-coffee",
    locationId: "eastside-coffee-montrose",
    status: "live",
    discountType: "percentage",
    discountAmountCents: null as number | null,
    discountPercent: 20,
    minimumPurchaseCents: 800,
    maxDiscountCents: 500,
    category: "coffee",
    teaserMode: "merchant_hidden",
    shortTerms: "20% off $8+, up to $5. Show your BearGo voucher when you pay.",
    restrictions: "Dine-in or pickup. One voucher per visit.",
    validWeekdays: [0, 1, 2, 3, 4, 5, 6],
    validMinutesStart: 0,
    validMinutesEnd: 24 * 60 - 1,
    voucherExpireHour: 1,
    maxRedemptions: 100,
    radiusMiles: 1.5,
    testMode: true,
  },
];

const ADMIN_USERS = [
  {
    email: "admin@beargo.pro",
    role: "admin",
    hostId: null as string | null,
    merchantId: null as string | null,
  },
  {
    email: "hello@beargo.pro",
    role: "admin",
    hostId: null as string | null,
    merchantId: null as string | null,
  },
];

const DEMO_USERS = [
  ...ADMIN_USERS,
  {
    email: "rustic@beargo.pro",
    role: "host",
    hostId: "the-rustic",
    merchantId: null as string | null,
  },
  {
    email: "riot@beargo.pro",
    role: "merchant",
    hostId: null as string | null,
    merchantId: "the-riot",
  },
  {
    email: "eastside@beargo.pro",
    role: "merchant",
    hostId: null as string | null,
    merchantId: "eastside-coffee",
  },
];

async function migrateSchema() {
  await db.execute(sql`
    ALTER TABLE hosts ADD COLUMN IF NOT EXISTS lat double precision;
    ALTER TABLE hosts ADD COLUMN IF NOT EXISTS lng double precision;
    ALTER TABLE hosts ADD COLUMN IF NOT EXISTS excluded_categories jsonb NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE hosts ADD COLUMN IF NOT EXISTS address text;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_id text;
    ALTER TABLE users DROP COLUMN IF EXISTS startup_id;

    ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS promotion_id text;
    ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS voucher_id text;
    ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS teaser_shown_at timestamptz;
    ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS offer_viewed_at timestamptz;
    ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
    ALTER TABLE scan_sessions DROP COLUMN IF EXISTS sponsor_viewed_at;
    ALTER TABLE scan_sessions DROP COLUMN IF EXISTS campaign_id;
    ALTER TABLE scan_sessions DROP COLUMN IF EXISTS lead_id;
    ALTER TABLE scan_sessions DROP COLUMN IF EXISTS interest_id;

    ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS merchant_id text;
    ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS promotion_id text;
    ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS voucher_id text;
    ALTER TABLE ledger_entries DROP COLUMN IF EXISTS startup_id;
    ALTER TABLE ledger_entries DROP COLUMN IF EXISTS campaign_id;
    ALTER TABLE ledger_entries DROP COLUMN IF EXISTS lead_id;

    CREATE TABLE IF NOT EXISTS merchants (
      id text PRIMARY KEY,
      display_name text NOT NULL,
      category text NOT NULL,
      logo_url text,
      status text NOT NULL DEFAULT 'active',
      billing_enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS merchant_locations (
      id text PRIMARY KEY,
      merchant_id text NOT NULL REFERENCES merchants(id),
      name text NOT NULL,
      address text NOT NULL,
      city text NOT NULL DEFAULT 'Houston',
      neighborhood text,
      lat double precision NOT NULL,
      lng double precision NOT NULL,
      timezone text NOT NULL DEFAULT 'America/Chicago',
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id text PRIMARY KEY,
      merchant_id text NOT NULL REFERENCES merchants(id),
      location_id text NOT NULL REFERENCES merchant_locations(id),
      status text NOT NULL DEFAULT 'paused',
      discount_type text NOT NULL,
      discount_amount_cents integer,
      discount_percent integer,
      minimum_purchase_cents integer NOT NULL,
      max_discount_cents integer,
      category text NOT NULL,
      teaser_mode text NOT NULL DEFAULT 'merchant_hidden',
      short_terms text NOT NULL DEFAULT '',
      restrictions text,
      starts_at timestamptz,
      ends_at timestamptz,
      valid_weekdays jsonb NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
      valid_minutes_start integer NOT NULL DEFAULT 0,
      valid_minutes_end integer NOT NULL DEFAULT 1439,
      voucher_expire_hour integer NOT NULL DEFAULT 1,
      max_redemptions integer,
      radius_miles double precision NOT NULL DEFAULT 1.5,
      test_mode boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS promotion_hosts (
      promotion_id text NOT NULL REFERENCES promotions(id),
      host_id text NOT NULL REFERENCES hosts(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS promotion_hosts_pk
      ON promotion_hosts (promotion_id, host_id);

    CREATE TABLE IF NOT EXISTS vouchers (
      id text PRIMARY KEY,
      token text NOT NULL,
      code text NOT NULL,
      promotion_id text NOT NULL REFERENCES promotions(id),
      merchant_id text NOT NULL REFERENCES merchants(id),
      location_id text NOT NULL REFERENCES merchant_locations(id),
      host_id text NOT NULL,
      paw_token text NOT NULL,
      session_id text,
      device_key text,
      status text NOT NULL DEFAULT 'claimed',
      claimed_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      redeemed_at timestamptz,
      redeemed_by_user_id text,
      redeemed_location_id text,
      purchase_subtotal_cents integer,
      discount_applied_cents integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS vouchers_token ON vouchers (token);
    CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code ON vouchers (code);

    CREATE UNIQUE INDEX IF NOT EXISTS ledger_voucher_fee
      ON ledger_entries (voucher_id, kind);

    CREATE TABLE IF NOT EXISTS players (
      id text PRIMARY KEY,
      full_name text NOT NULL,
      email text NOT NULL,
      email_normalized text NOT NULL,
      phone text NOT NULL,
      phone_normalized text NOT NULL,
      email_verified_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS players_email_normalized
      ON players (email_normalized);

    CREATE TABLE IF NOT EXISTS claim_links (
      token_hash text PRIMARY KEY,
      player_id text NOT NULL REFERENCES players(id),
      promotion_id text NOT NULL,
      host_id text NOT NULL,
      paw_token text NOT NULL,
      session_id text,
      device_key text,
      expires_at timestamptz NOT NULL,
      used_at timestamptz
    );

    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS player_id text REFERENCES players(id);

    DROP TABLE IF EXISTS lead_exports CASCADE;
    DROP TABLE IF EXISTS consent_receipts CASCADE;
    DROP TABLE IF EXISTS leads CASCADE;
    DROP TABLE IF EXISTS campaign_hosts CASCADE;
    DROP TABLE IF EXISTS campaigns CASCADE;
    DROP TABLE IF EXISTS startups CASCADE;
  `);
}

async function main() {
  await migrateSchema();

  const demo = process.env.SEED_DEMO === "1";
  const fresh = process.env.SEED_FRESH === "1";

  if (fresh) {
    await db.execute(sql`
      TRUNCATE TABLE
        vouchers,
        claim_links,
        players,
        ledger_entries,
        scan_sessions,
        plays,
        promotion_hosts,
        promotions,
        merchant_locations,
        merchants,
        paws,
        challenge_sets,
        applications,
        magic_links,
        hosts
      RESTART IDENTITY CASCADE;
      DELETE FROM users;
    `);
  }

  if (demo) {
    await db
      .insert(hosts)
      .values(HOSTS)
      .onConflictDoUpdate({
        target: hosts.id,
        set: {
          displayName: sql`excluded.display_name`,
          timezone: sql`excluded.timezone`,
          city: sql`excluded.city`,
          neighborhood: sql`excluded.neighborhood`,
          address: sql`excluded.address`,
          type: sql`excluded.type`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          excludedCategories: sql`excluded.excluded_categories`,
          excludedMerchantIds: sql`excluded.excluded_merchant_ids`,
        },
      });
    await db.insert(paws).values(PAWS).onConflictDoNothing();

    await db
      .insert(merchants)
      .values(MERCHANTS)
      .onConflictDoUpdate({
        target: merchants.id,
        set: {
          displayName: sql`excluded.display_name`,
          category: sql`excluded.category`,
          billingEnabled: sql`excluded.billing_enabled`,
        },
      });
    await db
      .insert(merchantLocations)
      .values(LOCATIONS)
      .onConflictDoUpdate({
        target: merchantLocations.id,
        set: {
          name: sql`excluded.name`,
          address: sql`excluded.address`,
          city: sql`excluded.city`,
          neighborhood: sql`excluded.neighborhood`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          timezone: sql`excluded.timezone`,
        },
      });
    await db
      .insert(promotions)
      .values(PROMOTIONS)
      .onConflictDoUpdate({
        target: promotions.id,
        set: {
          status: sql`excluded.status`,
          discountType: sql`excluded.discount_type`,
          discountAmountCents: sql`excluded.discount_amount_cents`,
          discountPercent: sql`excluded.discount_percent`,
          minimumPurchaseCents: sql`excluded.minimum_purchase_cents`,
          maxDiscountCents: sql`excluded.max_discount_cents`,
          category: sql`excluded.category`,
          teaserMode: sql`excluded.teaser_mode`,
          shortTerms: sql`excluded.short_terms`,
          restrictions: sql`excluded.restrictions`,
          validWeekdays: sql`excluded.valid_weekdays`,
          validMinutesStart: sql`excluded.valid_minutes_start`,
          validMinutesEnd: sql`excluded.valid_minutes_end`,
          voucherExpireHour: sql`excluded.voucher_expire_hour`,
          maxRedemptions: sql`excluded.max_redemptions`,
          radiusMiles: sql`excluded.radius_miles`,
          testMode: sql`excluded.test_mode`,
        },
      });
  }

  await db
    .insert(questions)
    .values(
      SEED_QUESTIONS.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        choices: question.choices,
        correctId: question.correctId,
        explanation: question.explanation,
        difficulty: question.difficulty,
        category: question.category ?? "general",
        conversationHook: question.conversationHook ?? null,
        status: "approved",
      })),
    )
    .onConflictDoUpdate({
      target: questions.id,
      set: {
        prompt: sql`excluded.prompt`,
        choices: sql`excluded.choices`,
        correctId: sql`excluded.correct_id`,
        explanation: sql`excluded.explanation`,
        difficulty: sql`excluded.difficulty`,
        category: sql`excluded.category`,
        conversationHook: sql`excluded.conversation_hook`,
        status: sql`excluded.status`,
      },
    });

  await db.delete(challengeSets);

  const staff = demo ? DEMO_USERS : ADMIN_USERS;
  await db
    .insert(users)
    .values(
      staff.map((user) => ({
        id: user.email,
        email: user.email,
        emailNormalized: normalizeEmail(user.email),
        role: user.role,
        hostId: user.hostId,
        merchantId: user.merchantId,
      })),
    )
    .onConflictDoUpdate({
      target: users.emailNormalized,
      set: {
        role: sql`excluded.role`,
        hostId: sql`excluded.host_id`,
        merchantId: sql`excluded.merchant_id`,
      },
    });

  await db.execute(sql`DELETE FROM users WHERE role = 'startup'`);
  if (!demo) {
    await db.execute(
      sql`DELETE FROM users WHERE email_normalized NOT IN ('admin@beargo.pro', 'hello@beargo.pro')`,
    );
    await db.execute(sql`UPDATE promotions SET test_mode = false`);
  }

  console.log(
    fresh && !demo
      ? "Wiped commercial data. Question pool and admin@beargo.pro / hello@beargo.pro staff only."
      : demo
        ? "Seeded demo hosts, merchants, promotions, questions, and staff users."
        : "Production staff: admin@beargo.pro and hello@beargo.pro. Demo logins removed. Live offers will bill $1.",
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

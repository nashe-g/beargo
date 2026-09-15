import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const hosts = pgTable("hosts", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("America/Chicago"),
  city: text("city").notNull().default("Houston"),
  neighborhood: text("neighborhood"),
  address: text("address"),
  type: text("type").notNull().default("venue"),
  status: text("status").notNull().default("active"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  excludedCategories: jsonb("excluded_categories")
    .$type<string[]>()
    .notNull()
    .default([]),
  excludedMerchantIds: jsonb("excluded_merchant_ids")
    .$type<string[]>()
    .notNull()
    .default([]),
  excludedPromotionIds: jsonb("excluded_promotion_ids")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paws = pgTable("paws", {
  token: text("token").primaryKey(),
  hostId: text("host_id")
    .notNull()
    .references(() => hosts.id),
  placementLabel: text("placement_label").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  choices: jsonb("choices")
    .$type<{ id: string; label: string }[]>()
    .notNull(),
  correctId: text("correct_id").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull().default("general"),
  pool: text("pool").notNull().default("global"),
  status: text("status").notNull().default("approved"),
  conversationHook: text("conversation_hook"),
  sourceNotes: text("source_notes"),
  generationModel: text("generation_model"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionCandidates = pgTable("question_candidates", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  choices: jsonb("choices")
    .$type<{ id: string; label: string }[]>()
    .notNull(),
  correctId: text("correct_id"),
  explanation: text("explanation"),
  difficulty: text("difficulty"),
  category: text("category").notNull().default("general"),
  conversationHook: text("conversation_hook"),
  sourceNotes: text("source_notes"),
  generationModel: text("generation_model"),
  promptVersion: text("prompt_version"),
  verificationStatus: text("verification_status").notNull().default("needs_review"),
  validationErrors: jsonb("validation_errors").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeSets = pgTable(
  "challenge_sets",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id").notNull(),
    localDate: text("local_date").notNull(),
    questionIds: jsonb("question_ids").$type<string[]>().notNull(),
    snapshot: jsonb("snapshot").$type<unknown>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("challenge_sets_host_date").on(table.hostId, table.localDate)],
);

export const questionSlates = pgTable("question_slates", {
  localDate: text("local_date").primaryKey(),
  status: text("status").notNull().default("draft"),
  questionIds: jsonb("question_ids").$type<string[]>().notNull(),
  snapshot: jsonb("snapshot").$type<unknown>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default("active"),
  billingEnabled: boolean("billing_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const merchantLocations = pgTable("merchant_locations", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull().default("Houston"),
  neighborhood: text("neighborhood"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  timezone: text("timezone").notNull().default("America/Chicago"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id),
  locationId: text("location_id")
    .notNull()
    .references(() => merchantLocations.id),
  status: text("status").notNull().default("paused"),
  discountType: text("discount_type").notNull(),
  discountAmountCents: integer("discount_amount_cents"),
  discountPercent: integer("discount_percent"),
  minimumPurchaseCents: integer("minimum_purchase_cents").notNull(),
  maxDiscountCents: integer("max_discount_cents"),
  category: text("category").notNull(),
  teaserMode: text("teaser_mode").notNull().default("merchant_hidden"),
  shortTerms: text("short_terms").notNull().default(""),
  restrictions: text("restrictions"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  validWeekdays: jsonb("valid_weekdays").$type<number[]>().notNull().default([0, 1, 2, 3, 4, 5, 6]),
  validMinutesStart: integer("valid_minutes_start").notNull().default(0),
  validMinutesEnd: integer("valid_minutes_end").notNull().default(24 * 60 - 1),
  voucherExpireHour: integer("voucher_expire_hour").notNull().default(1),
  maxRedemptions: integer("max_redemptions"),
  radiusMiles: doublePrecision("radius_miles").notNull().default(1.5),
  testMode: boolean("test_mode").notNull().default(false),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promotionHosts = pgTable(
  "promotion_hosts",
  {
    promotionId: text("promotion_id")
      .notNull()
      .references(() => promotions.id),
    hostId: text("host_id")
      .notNull()
      .references(() => hosts.id),
  },
  (table) => [uniqueIndex("promotion_hosts_pk").on(table.promotionId, table.hostId)],
);

export const plays = pgTable("plays", {
  id: text("id").primaryKey(),
  pawToken: text("paw_token").notNull(),
  hostId: text("host_id").notNull(),
  challengeId: text("challenge_id").notNull(),
  sessionId: text("session_id"),
  localDate: text("local_date").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalResponseMs: integer("total_response_ms").notNull(),
  pourMg: integer("pour_mg"),
  stackWobble: integer("stack_wobble"),
  boardName: text("board_name"),
  rankingEligible: boolean("ranking_eligible").notNull().default(true),
  deviceKey: text("device_key"),
  playSource: text("play_source"),
  kind: text("kind"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scanSessions = pgTable("scan_sessions", {
  id: text("id").primaryKey(),
  pawToken: text("paw_token").notNull(),
  hostId: text("host_id").notNull(),
  localDate: text("local_date").notNull(),
  challengeId: text("challenge_id"),
  promotionId: text("promotion_id"),
  voucherId: text("voucher_id"),
  deviceKey: text("device_key"),
  entrySource: text("entry_source"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
  gameStartedAt: timestamp("game_started_at", { withTimezone: true }),
  gameCompletedAt: timestamp("game_completed_at", { withTimezone: true }),
  teaserShownAt: timestamp("teaser_shown_at", { withTimezone: true }),
  teaserOpenedAt: timestamp("teaser_opened_at", { withTimezone: true }),
  offerViewedAt: timestamp("offer_viewed_at", { withTimezone: true }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const players = pgTable(
  "players",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    phone: text("phone").notNull(),
    phoneNormalized: text("phone_normalized").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("players_email_normalized").on(table.emailNormalized)],
);

export const claimLinks = pgTable("claim_links", {
  tokenHash: text("token_hash").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  promotionId: text("promotion_id").notNull(),
  hostId: text("host_id").notNull(),
  pawToken: text("paw_token").notNull(),
  sessionId: text("session_id"),
  deviceKey: text("device_key"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const vouchers = pgTable(
  "vouchers",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    code: text("code").notNull(),
    playerId: text("player_id").references(() => players.id),
    promotionId: text("promotion_id")
      .notNull()
      .references(() => promotions.id),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    locationId: text("location_id")
      .notNull()
      .references(() => merchantLocations.id),
    hostId: text("host_id").notNull(),
    pawToken: text("paw_token").notNull(),
    sessionId: text("session_id"),
    deviceKey: text("device_key"),
    status: text("status").notNull().default("claimed"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedByUserId: text("redeemed_by_user_id"),
    redeemedLocationId: text("redeemed_location_id"),
    purchaseSubtotalCents: integer("purchase_subtotal_cents"),
    discountAppliedCents: integer("discount_applied_cents"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vouchers_token").on(table.token),
    uniqueIndex("vouchers_code").on(table.code),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    amountCents: integer("amount_cents").notNull(),
    merchantId: text("merchant_id"),
    hostId: text("host_id"),
    promotionId: text("promotion_id"),
    voucherId: text("voucher_id"),
    status: text("status").notNull().default("accrued"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ledger_voucher_fee").on(table.voucherId, table.kind)],
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    role: text("role").notNull(),
    hostId: text("host_id"),
    merchantId: text("merchant_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_normalized").on(table.emailNormalized)],
);

export const magicLinks = pgTable("magic_links", {
  tokenHash: text("token_hash").primaryKey(),
  emailNormalized: text("email_normalized").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").$type<Record<string, string>>().notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionReports = pgTable("question_reports", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull(),
  pawToken: text("paw_token"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const affiliateAdvertisers = pgTable("affiliate_advertisers", {
  id: text("id").primaryKey(),
  network: text("network").notNull().default("CJ"),
  networkAdvertiserId: text("network_advertiser_id"),
  name: text("name").notNull(),
  relationshipStatus: text("relationship_status").notNull().default("pending"),
  serviceableCountries: jsonb("serviceable_countries")
    .$type<string[]>()
    .notNull()
    .default(["US"]),
  termsReviewedAt: timestamp("terms_reviewed_at", { withTimezone: true }),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const affiliateOffers = pgTable("affiliate_offers", {
  id: text("id").primaryKey(),
  advertiserId: text("advertiser_id")
    .notNull()
    .references(() => affiliateAdvertisers.id),
  network: text("network").notNull().default("CJ"),
  offerType: text("offer_type").notNull().default("advertiser_landing"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  ctaLabel: text("cta_label").notNull(),
  affiliateClickUrl: text("affiliate_click_url").notNull(),
  advertiserDestination: text("advertiser_destination"),
  imageUrl: text("image_url"),
  sourceLinkId: text("source_link_id"),
  sourceProductId: text("source_product_id"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  targetCountries: jsonb("target_countries")
    .$type<string[]>()
    .notNull()
    .default(["US"]),
  adminWeight: integer("admin_weight").notNull().default(1),
  complianceReviewed: boolean("compliance_reviewed").notNull().default(false),
  active: boolean("active").notNull().default(false),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const affiliateEvents = pgTable("affiliate_events", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  placement: text("placement").notNull().default("post_game_leaderboard"),
  offerId: text("offer_id").notNull(),
  advertiserId: text("advertiser_id").notNull(),
  hostId: text("host_id"),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedIdentities = pgTable(
  "feed_identities",
  {
    id: text("id").primaryKey(),
    deviceKey: text("device_key").notNull(),
    publicHandle: text("public_handle").notNull(),
    trustLevel: text("trust_level").notNull().default("new"),
    postingStatus: text("posting_status").notNull().default("ok"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("feed_identities_device_key").on(table.deviceKey),
    uniqueIndex("feed_identities_public_handle").on(table.publicHandle),
  ],
);

export const feedPosts = pgTable("feed_posts", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  pawToken: text("paw_token").notNull(),
  identityId: text("identity_id")
    .notNull()
    .references(() => feedIdentities.id),
  handleSnapshot: text("handle_snapshot").notNull(),
  body: text("body").notNull(),
  parentPostId: text("parent_post_id"),
  status: text("status").notNull().default("published"),
  upvoteCount: integer("upvote_count").notNull().default(0),
  downvoteCount: integer("downvote_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  authorKind: text("author_kind").notNull().default("human"),
  houseSlot: text("house_slot"),
  houseLineId: text("house_line_id"),
  playKind: text("play_kind"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nightTables = pgTable(
  "night_tables",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id").notNull(),
    pawToken: text("paw_token").notNull(),
    serviceDay: text("service_day").notNull(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    joinCode: text("join_code").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("night_tables_host_day_code").on(
      table.hostId,
      table.serviceDay,
      table.joinCode,
    ),
    uniqueIndex("night_tables_host_day_name").on(
      table.hostId,
      table.serviceDay,
      table.nameKey,
    ),
  ],
);

export const nightTableMembers = pgTable(
  "night_table_members",
  {
    id: text("id").primaryKey(),
    tableId: text("table_id")
      .notNull()
      .references(() => nightTables.id),
    deviceKey: text("device_key").notNull(),
    nickname: text("nickname").notNull(),
    nicknameKey: text("nickname_key").notNull(),
    isCreator: boolean("is_creator").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("night_table_members_table_device").on(
      table.tableId,
      table.deviceKey,
    ),
    uniqueIndex("night_table_members_table_nick").on(
      table.tableId,
      table.nicknameKey,
    ),
  ],
);

export const houseNights = pgTable(
  "house_nights",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id").notNull(),
    pawToken: text("paw_token").notNull(),
    serviceDay: text("service_day").notNull(),
    leadKind: text("lead_kind"),
    leadLineId: text("lead_line_id"),
    leadPostId: text("lead_post_id"),
    secondKind: text("second_kind"),
    secondLineId: text("second_line_id"),
    secondPostId: text("second_post_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("house_nights_host_day").on(table.hostId, table.serviceDay)],
);

export const feedModerationResults = pgTable("feed_moderation_results", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => feedPosts.id),
  piiDetected: boolean("pii_detected").notNull().default(false),
  piiTypes: jsonb("pii_types").$type<string[]>().notNull().default([]),
  omniFlagged: boolean("omni_flagged"),
  omniCategoryScoresJson: jsonb("omni_category_scores_json").$type<
    Record<string, number>
  >(),
  decision: text("decision").notNull(),
  decisionReason: text("decision_reason").notNull(),
  wouldDecision: text("would_decision"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedVotes = pgTable(
  "feed_votes",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => feedPosts.id),
    identityId: text("identity_id")
      .notNull()
      .references(() => feedIdentities.id),
    voteType: text("vote_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("feed_votes_post_identity").on(table.postId, table.identityId)],
);

export const feedReports = pgTable(
  "feed_reports",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => feedPosts.id),
    reporterIdentityId: text("reporter_identity_id")
      .notNull()
      .references(() => feedIdentities.id),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("feed_reports_post_reporter").on(table.postId, table.reporterIdentityId),
  ],
);

export const feedEnforcementEvents = pgTable("feed_enforcement_events", {
  id: text("id").primaryKey(),
  identityId: text("identity_id")
    .notNull()
    .references(() => feedIdentities.id),
  postId: text("post_id"),
  eventType: text("event_type").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

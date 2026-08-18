import {
  boolean,
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
  type: text("type").notNull().default("venue"),
  status: text("status").notNull().default("active"),
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

export const startups = pgTable("startups", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  oneLiner: text("one_liner").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  startupId: text("startup_id")
    .notNull()
    .references(() => startups.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("paused"),
  headline: text("headline").notNull().default("TODAY'S SPONSOR"),
  valueProposition: text("value_proposition").notNull(),
  eligibleInterestIds: jsonb("eligible_interest_ids").$type<string[]>().notNull(),
  qualifyQuestions: jsonb("qualify_questions").$type<unknown[]>().notNull().default([]),
  grossCplCents: integer("gross_cpl_cents").notNull(),
  hostAmountCents: integer("host_amount_cents").notNull(),
  platformAmountCents: integer("platform_amount_cents").notNull(),
  fundedBalanceCents: integer("funded_balance_cents").notNull().default(0),
  maxLeads: integer("max_leads"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  completionUrl: text("completion_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignHosts = pgTable(
  "campaign_hosts",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    hostId: text("host_id")
      .notNull()
      .references(() => hosts.id),
  },
  (table) => [uniqueIndex("campaign_hosts_pk").on(table.campaignId, table.hostId)],
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
  rankingEligible: boolean("ranking_eligible").notNull().default(true),
  deviceKey: text("device_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scanSessions = pgTable("scan_sessions", {
  id: text("id").primaryKey(),
  pawToken: text("paw_token").notNull(),
  hostId: text("host_id").notNull(),
  localDate: text("local_date").notNull(),
  challengeId: text("challenge_id"),
  campaignId: text("campaign_id"),
  deviceKey: text("device_key"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
  gameStartedAt: timestamp("game_started_at", { withTimezone: true }),
  gameCompletedAt: timestamp("game_completed_at", { withTimezone: true }),
  teaserOpenedAt: timestamp("teaser_opened_at", { withTimezone: true }),
  sponsorViewedAt: timestamp("sponsor_viewed_at", { withTimezone: true }),
  interestId: text("interest_id"),
  leadId: text("lead_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  pawToken: text("paw_token").notNull(),
  hostId: text("host_id").notNull(),
  startupId: text("startup_id").notNull(),
  campaignId: text("campaign_id").notNull(),
  sessionId: text("session_id"),
  interestId: text("interest_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  emailNormalized: text("email_normalized").notNull(),
  phone: text("phone").notNull(),
  phoneNormalized: text("phone_normalized").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  verifyTokenHash: text("verify_token_hash"),
  verifyExpiresAt: timestamp("verify_expires_at", { withTimezone: true }),
  verificationEmailSentAt: timestamp("verification_email_sent_at", { withTimezone: true }),
  verificationEmailCount: integer("verification_email_count").notNull().default(0),
  qualification: jsonb("qualification").$type<Record<string, string>>().notNull().default({}),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  consentVersion: text("consent_version"),
  status: text("status").notNull(),
  grossCplCents: integer("gross_cpl_cents"),
  hostAmountCents: integer("host_amount_cents"),
  platformAmountCents: integer("platform_amount_cents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
});

export const consentReceipts = pgTable("consent_receipts", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  startupId: text("startup_id").notNull(),
  version: text("version").notNull(),
  text: text("text").notNull(),
  fields: text("fields").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  amountCents: integer("amount_cents").notNull(),
  hostId: text("host_id"),
  startupId: text("startup_id"),
  campaignId: text("campaign_id"),
  leadId: text("lead_id"),
  status: text("status").notNull().default("posted"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    role: text("role").notNull(),
    hostId: text("host_id"),
    startupId: text("startup_id"),
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

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadExports = pgTable("lead_exports", {
  id: text("id").primaryKey(),
  startupId: text("startup_id").notNull(),
  leadCount: integer("lead_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

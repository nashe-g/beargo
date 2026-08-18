import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  campaignHosts,
  campaigns,
  hosts,
  paws,
  questions,
  startups,
  users,
} from "./schema";
import { SEED_CAMPAIGNS } from "../lib/campaigns";
import { centsFromDollars } from "../lib/money";
import { normalizeEmail } from "../lib/normalize";
import { SEED_QUESTIONS } from "../lib/questions";

const url =
  process.env.DATABASE_URL || "postgresql://beargo:beargo@localhost:5432/beargo";

const sql = postgres(url, {
  max: 1,
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : true,
});
const db = drizzle(sql);

const HOSTS = [
  {
    id: "the-rustic",
    displayName: "The Rustic",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Washington Avenue",
    type: "venue",
  },
  {
    id: "the-quiet-room",
    displayName: "The Quiet Room",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Montrose",
    type: "venue",
  },
  {
    id: "rice-union",
    displayName: "Rice Union",
    timezone: "America/Chicago",
    city: "Houston",
    neighborhood: "Rice Village",
    type: "campus",
  },
];

const PAWS = [
  { token: "demo", hostId: "the-rustic", placementLabel: "Bar top" },
  { token: "quiet", hostId: "the-quiet-room", placementLabel: "Front table" },
];

const STARTUPS = [
  {
    id: "jobradar",
    displayName: "JobRadar",
    oneLiner: "Jobs matched to what people are looking for.",
  },
  {
    id: "hoplist",
    displayName: "HopList",
    oneLiner: "Houston happy hours, tap lists, and rooms worth going out for.",
  },
  {
    id: "campusbite",
    displayName: "CampusBite",
    oneLiner: "Campus food, without the dining-hall guesswork.",
  },
  {
    id: "nightowl",
    displayName: "NightOwl",
    oneLiner: "Late-night plans, without the group chat.",
  },
];

const USERS = [
  { email: "admin@beargo.pro", role: "admin", hostId: null, startupId: null },
  {
    email: "rustic@beargo.pro",
    role: "host",
    hostId: "the-rustic",
    startupId: null,
  },
  {
    email: "jobradar@beargo.pro",
    role: "startup",
    hostId: null,
    startupId: "jobradar",
  },
  {
    email: "hoplist@beargo.pro",
    role: "startup",
    hostId: null,
    startupId: "hoplist",
  },
];

async function main() {
  await db
    .insert(hosts)
    .values(HOSTS)
    .onConflictDoNothing();
  await db.insert(paws).values(PAWS).onConflictDoNothing();
  await db.insert(startups).values(STARTUPS).onConflictDoNothing();
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
        status: "approved",
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(campaigns)
    .values(
      SEED_CAMPAIGNS.map((campaign) => ({
        id: campaign.id,
        startupId: campaign.startupId,
        name: campaign.name,
        status: campaign.status,
        headline: campaign.headline,
        valueProposition: campaign.valueProposition,
        eligibleInterestIds: campaign.eligibleInterestIds,
        qualifyQuestions: campaign.questions,
        grossCplCents: centsFromDollars(campaign.grossCpl),
        hostAmountCents: centsFromDollars(campaign.hostAmount),
        platformAmountCents: centsFromDollars(campaign.platformAmount),
        fundedBalanceCents: centsFromDollars(campaign.fundedBalance),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(campaignHosts)
    .values(
      SEED_CAMPAIGNS.flatMap((campaign) =>
        campaign.eligibleHostIds.map((hostId) => ({
          campaignId: campaign.id,
          hostId,
        })),
      ),
    )
    .onConflictDoNothing();

  await db
    .insert(users)
    .values(
      USERS.map((user) => ({
        id: user.email,
        email: user.email,
        emailNormalized: normalizeEmail(user.email),
        role: user.role,
        hostId: user.hostId,
        startupId: user.startupId,
      })),
    )
    .onConflictDoNothing();

  console.log("Seeded BearGo catalogs, question pool, campaigns, and demo users.");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

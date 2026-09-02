import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { feedModerationResults } from "@/db/schema";
import { FEED_MODERATION_SHADOW } from "@/lib/config";
import { detectFeedPii } from "@/lib/feed-pii";
import { ensureFeedTables } from "@/lib/feed-schema";

const MUST_ALLOW = [
  "This place is dead.",
  "DJ needs to be arrested for that transition.",
  "Bartender hates us lol.",
  "Dude at darts is cracked.",
  "Who brought their dad here?",
  "Crowd is surprisingly good tonight.",
  "Bathroom looks like a crime scene.",
  "The bouncers here suck.",
  "Guy in the cowboy hat is carrying this entire bar.",
  "Whoever keeps requesting Mr. Brightside needs help.",
];

const MUST_BLOCK_PII = [
  "Sarah's number is 713-555-1234.",
  "Email me at nate@gmail.com",
  "She lives at 1842 Hazard Street",
];

export async function feedShadowSummary() {
  await ensureFeedTables();
  const rows = await db()
    .select({
      decision: feedModerationResults.decision,
      wouldDecision: feedModerationResults.wouldDecision,
      reason: feedModerationResults.decisionReason,
    })
    .from(feedModerationResults);

  const total = rows.length;
  const wouldBlock = rows.filter(
    (row) => row.wouldDecision === "block" || row.wouldDecision === "intervene",
  ).length;
  const shadowed = rows.filter(
    (row) =>
      row.decision === "allow" &&
      (row.wouldDecision === "block" || row.wouldDecision === "intervene"),
  ).length;
  const enforced = rows.filter((row) => row.decision === "block").length;

  const piiFalsePositives = MUST_ALLOW.filter(
    (text) => detectFeedPii(text).types.length > 0,
  );
  const piiMisses = MUST_BLOCK_PII.filter(
    (text) => detectFeedPii(text).types.length === 0,
  );

  return {
    shadow: FEED_MODERATION_SHADOW,
    total,
    wouldBlock,
    wouldBlockPct: total === 0 ? 0 : Math.round((wouldBlock / total) * 1000) / 10,
    shadowed,
    enforced,
    piiReady: piiFalsePositives.length === 0 && piiMisses.length === 0,
    piiFalsePositives,
    piiMisses,
  };
}

export async function recentWouldBlocks(limit = 12) {
  await ensureFeedTables();
  return db()
    .select()
    .from(feedModerationResults)
    .where(eq(feedModerationResults.wouldDecision, "block"))
    .orderBy(desc(feedModerationResults.createdAt))
    .limit(limit);
}

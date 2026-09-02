import { sql } from "drizzle-orm";
import { db } from "@/db";

let tablesReady = false;

export async function ensureFeedTables() {
  if (tablesReady) return;
  await db().execute(sql`
    CREATE TABLE IF NOT EXISTS feed_identities (
      id text PRIMARY KEY,
      device_key text NOT NULL,
      public_handle text NOT NULL,
      trust_level text NOT NULL DEFAULT 'new',
      posting_status text NOT NULL DEFAULT 'ok',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS feed_identities_device_key
      ON feed_identities (device_key);
    CREATE UNIQUE INDEX IF NOT EXISTS feed_identities_public_handle
      ON feed_identities (public_handle);

    CREATE TABLE IF NOT EXISTS feed_posts (
      id text PRIMARY KEY,
      host_id text NOT NULL,
      paw_token text NOT NULL,
      identity_id text NOT NULL REFERENCES feed_identities(id),
      handle_snapshot text NOT NULL,
      body text NOT NULL,
      parent_post_id text,
      status text NOT NULL DEFAULT 'published',
      upvote_count integer NOT NULL DEFAULT 0,
      downvote_count integer NOT NULL DEFAULT 0,
      reply_count integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS feed_posts_host_created
      ON feed_posts (host_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS feed_posts_parent
      ON feed_posts (parent_post_id);

    CREATE TABLE IF NOT EXISTS feed_moderation_results (
      id text PRIMARY KEY,
      post_id text NOT NULL REFERENCES feed_posts(id),
      pii_detected boolean NOT NULL DEFAULT false,
      pii_types jsonb NOT NULL DEFAULT '[]'::jsonb,
      omni_flagged boolean,
      omni_category_scores_json jsonb,
      decision text NOT NULL,
      decision_reason text NOT NULL,
      would_decision text,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS feed_votes (
      id text PRIMARY KEY,
      post_id text NOT NULL REFERENCES feed_posts(id),
      identity_id text NOT NULL REFERENCES feed_identities(id),
      vote_type text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS feed_votes_post_identity
      ON feed_votes (post_id, identity_id);

    CREATE TABLE IF NOT EXISTS feed_reports (
      id text PRIMARY KEY,
      post_id text NOT NULL REFERENCES feed_posts(id),
      reporter_identity_id text NOT NULL REFERENCES feed_identities(id),
      reason text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS feed_reports_post_reporter
      ON feed_reports (post_id, reporter_identity_id);

    CREATE TABLE IF NOT EXISTS feed_enforcement_events (
      id text PRIMARY KEY,
      identity_id text NOT NULL REFERENCES feed_identities(id),
      post_id text,
      event_type text NOT NULL,
      reason text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz
    );
  `);
  tablesReady = true;
}

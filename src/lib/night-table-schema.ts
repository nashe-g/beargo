import { sql } from "drizzle-orm";
import { db } from "@/db";

let tablesReady = false;

export async function ensureNightTables() {
  if (tablesReady) return;
  await db().execute(sql`
    CREATE TABLE IF NOT EXISTS night_tables (
      id text PRIMARY KEY,
      host_id text NOT NULL,
      paw_token text NOT NULL,
      service_day text NOT NULL,
      name text NOT NULL,
      name_key text NOT NULL,
      join_code text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      locked_at timestamptz
    );
    CREATE UNIQUE INDEX IF NOT EXISTS night_tables_host_day_code
      ON night_tables (host_id, service_day, join_code);
    CREATE UNIQUE INDEX IF NOT EXISTS night_tables_host_day_name
      ON night_tables (host_id, service_day, name_key);

    CREATE TABLE IF NOT EXISTS night_table_members (
      id text PRIMARY KEY,
      table_id text NOT NULL REFERENCES night_tables(id),
      device_key text NOT NULL,
      nickname text NOT NULL,
      nickname_key text NOT NULL,
      is_creator boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS night_table_members_table_device
      ON night_table_members (table_id, device_key);
    CREATE UNIQUE INDEX IF NOT EXISTS night_table_members_table_nick
      ON night_table_members (table_id, nickname_key);
  `);
  tablesReady = true;
}

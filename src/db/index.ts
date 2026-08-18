import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export const DEFAULT_DATABASE_URL =
  "postgresql://beargo:beargo@localhost:5432/beargo";

export function databaseUrl() {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  beargoDb?: Db;
  beargoSql?: ReturnType<typeof postgres>;
};

export function db(): Db {
  if (globalForDb.beargoDb) return globalForDb.beargoDb;

  const url = databaseUrl();
  const sql =
    globalForDb.beargoSql ??
    postgres(url, {
      max: 1,
      prepare: false,
      ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : true,
    });
  globalForDb.beargoSql = sql;

  const instance = drizzle(sql, { schema });
  globalForDb.beargoDb = instance;
  return instance;
}

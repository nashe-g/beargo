import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { isoRequired } from "@/lib/money";

export type Application = {
  id: string;
  kind: "host" | "merchant";
  payload: Record<string, string>;
  status: string;
  createdAt: string;
};

function mapRow(row: typeof applications.$inferSelect): Application {
  return {
    id: row.id,
    kind: row.kind as Application["kind"],
    payload: row.payload,
    status: row.status,
    createdAt: isoRequired(row.createdAt),
  };
}

export async function createApplication(
  kind: Application["kind"],
  payload: Record<string, string>,
) {
  const id = randomUUID();
  await db().insert(applications).values({ id, kind, payload, status: "pending" });
  return id;
}

export async function listApplications(status = "pending") {
  const rows = await db()
    .select()
    .from(applications)
    .where(eq(applications.status, status))
    .orderBy(desc(applications.createdAt));
  return rows.map(mapRow);
}

export async function getApplication(id: string) {
  const [row] = await db()
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function setApplicationStatus(id: string, status: string) {
  await db().update(applications).set({ status }).where(eq(applications.id, id));
}

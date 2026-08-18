import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function audit(
  actor: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  await db().insert(auditLogs).values({
    id: randomUUID(),
    actor,
    action,
    payload,
  });
}

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hosts, paws, questions } from "@/db/schema";
import type { HostRecord } from "@/lib/hosts";
import type { PawRecord } from "@/lib/paws";
import type { Question, QuestionDifficulty } from "@/lib/questions";
import { slugify } from "@/lib/slug";

export function unassignedPaw(token: string): PawRecord {
  return {
    token,
    hostId: token,
    hostDisplayName: "this place",
    placementLabel: "Unassigned",
    timezone: "America/Chicago",
    status: "active",
  };
}

function mapHost(row: typeof hosts.$inferSelect): HostRecord {
  return {
    id: row.id,
    displayName: row.displayName,
    timezone: row.timezone,
    city: row.city,
    neighborhood: row.neighborhood,
    type: row.type,
    status: row.status,
    lat: row.lat,
    lng: row.lng,
    excludedCategories: row.excludedCategories ?? [],
    excludedMerchantIds: row.excludedMerchantIds ?? [],
  };
}

async function hostNames() {
  const rows = await db().select().from(hosts);
  return new Map(rows.map((row) => [row.id, row]));
}

export async function listHosts() {
  const rows = await db().select().from(hosts).orderBy(hosts.displayName);
  return rows.map(mapHost);
}

export async function getHost(hostId: string) {
  const [row] = await db().select().from(hosts).where(eq(hosts.id, hostId)).limit(1);
  return row ? mapHost(row) : null;
}

export async function upsertHost(input: {
  id?: string;
  displayName: string;
  timezone: string;
  city?: string;
  neighborhood?: string | null;
  type?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
  excludedCategories?: string[];
  excludedMerchantIds?: string[];
}) {
  const id = input.id || slugify(input.displayName);
  await db()
    .insert(hosts)
    .values({
      id,
      displayName: input.displayName,
      timezone: input.timezone,
      city: input.city ?? "Houston",
      neighborhood: input.neighborhood ?? null,
      type: input.type ?? "venue",
      status: input.status ?? "active",
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      excludedCategories: input.excludedCategories ?? [],
      excludedMerchantIds: input.excludedMerchantIds ?? [],
    })
    .onConflictDoUpdate({
      target: hosts.id,
      set: {
        displayName: input.displayName,
        timezone: input.timezone,
        city: input.city ?? "Houston",
        neighborhood: input.neighborhood ?? null,
        type: input.type ?? "venue",
        status: input.status ?? "active",
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        excludedCategories: input.excludedCategories ?? [],
        excludedMerchantIds: input.excludedMerchantIds ?? [],
      },
    });
  return (await getHost(id))!;
}

async function mapPaw(
  row: typeof paws.$inferSelect,
  hostMap?: Map<string, typeof hosts.$inferSelect>,
): Promise<PawRecord> {
  const host = hostMap?.get(row.hostId) ?? (await getHost(row.hostId));
  return {
    token: row.token,
    hostId: row.hostId,
    hostDisplayName: host?.displayName ?? "this place",
    placementLabel: row.placementLabel,
    timezone: host?.timezone ?? "America/Chicago",
    status: row.status === "inactive" ? "inactive" : "active",
  };
}

export async function listPaws() {
  const [rows, hostMap] = await Promise.all([
    db().select().from(paws).orderBy(paws.token),
    hostNames(),
  ]);
  return Promise.all(rows.map((row) => mapPaw(row, hostMap)));
}

export async function getPaw(token: string): Promise<PawRecord> {
  const [row] = await db().select().from(paws).where(eq(paws.token, token)).limit(1);
  if (!row) return unassignedPaw(token);
  return mapPaw(row);
}

export async function pawsForHost(hostId: string) {
  const [rows, hostMap] = await Promise.all([
    db().select().from(paws).where(eq(paws.hostId, hostId)),
    hostNames(),
  ]);
  return Promise.all(rows.map((row) => mapPaw(row, hostMap)));
}

export async function upsertPaw(input: {
  token: string;
  hostId: string;
  placementLabel: string;
  status?: "active" | "inactive";
}) {
  await db()
    .insert(paws)
    .values({
      token: input.token,
      hostId: input.hostId,
      placementLabel: input.placementLabel,
      status: input.status ?? "active",
    })
    .onConflictDoUpdate({
      target: paws.token,
      set: {
        hostId: input.hostId,
        placementLabel: input.placementLabel,
        status: input.status ?? "active",
      },
    });
  return getPaw(input.token);
}

export function mapQuestion(row: typeof questions.$inferSelect): Question {
  return {
    id: row.id,
    prompt: row.prompt,
    choices: row.choices,
    correctId: row.correctId,
    explanation: row.explanation,
    difficulty: row.difficulty as QuestionDifficulty,
    category: row.category,
    conversationHook: row.conversationHook ?? undefined,
  };
}

export async function listQuestions() {
  const rows = await db()
    .select()
    .from(questions)
    .where(eq(questions.status, "approved"))
    .orderBy(questions.difficulty, questions.id);
  return rows.map(mapQuestion);
}

export async function getQuestion(id: string) {
  const [row] = await db()
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);
  return row ? mapQuestion(row) : null;
}

export async function insertApprovedQuestion(input: {
  id?: string;
  prompt: string;
  choices: { id: string; label: string }[];
  correctId: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  category?: string;
  conversationHook?: string | null;
  sourceNotes?: string | null;
  generationModel?: string | null;
}) {
  const id = input.id || randomUUID();
  await db().insert(questions).values({
    id,
    prompt: input.prompt,
    choices: input.choices,
    correctId: input.correctId,
    explanation: input.explanation,
    difficulty: input.difficulty,
    category: input.category ?? "general",
    conversationHook: input.conversationHook ?? null,
    sourceNotes: input.sourceNotes ?? null,
    generationModel: input.generationModel ?? null,
    status: "approved",
  });
  return (await getQuestion(id))!;
}

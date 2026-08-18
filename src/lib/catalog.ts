import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  campaignHosts,
  campaigns,
  hosts,
  paws,
  questions,
  startups,
} from "@/db/schema";
import type { Campaign, CampaignStatus, QualifyQuestion } from "@/lib/campaigns";
import type { HostRecord } from "@/lib/hosts";
import { centsFromDollars, dollarsFromCents, iso } from "@/lib/money";
import type { PawRecord } from "@/lib/paws";
import type { Question, QuestionDifficulty } from "@/lib/questions";
import { slugify } from "@/lib/slug";
import type { StartupRecord } from "@/lib/startups";

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

export async function listStartups() {
  const rows = await db().select().from(startups).orderBy(startups.displayName);
  return rows.map(
    (row): StartupRecord => ({
      id: row.id,
      displayName: row.displayName,
      oneLiner: row.oneLiner,
      status: row.status,
    }),
  );
}

export async function getStartup(id: string) {
  const [row] = await db()
    .select()
    .from(startups)
    .where(eq(startups.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.displayName,
    oneLiner: row.oneLiner,
    status: row.status,
  } satisfies StartupRecord;
}

export async function upsertStartup(input: {
  id?: string;
  displayName: string;
  oneLiner: string;
  status?: string;
}) {
  const id = input.id || slugify(input.displayName);
  await db()
    .insert(startups)
    .values({
      id,
      displayName: input.displayName,
      oneLiner: input.oneLiner,
      status: input.status ?? "active",
    })
    .onConflictDoUpdate({
      target: startups.id,
      set: {
        displayName: input.displayName,
        oneLiner: input.oneLiner,
        status: input.status ?? "active",
      },
    });
  return (await getStartup(id))!;
}

async function hostIdsForCampaign(campaignId: string) {
  const rows = await db()
    .select()
    .from(campaignHosts)
    .where(eq(campaignHosts.campaignId, campaignId));
  return rows.map((row) => row.hostId);
}

function mapCampaign(
  row: typeof campaigns.$inferSelect,
  eligibleHostIds: string[],
): Campaign {
  return {
    id: row.id,
    startupId: row.startupId,
    name: row.name,
    status: row.status as CampaignStatus,
    headline: row.headline,
    valueProposition: row.valueProposition,
    eligibleHostIds,
    eligibleInterestIds: row.eligibleInterestIds as Campaign["eligibleInterestIds"],
    questions: (row.qualifyQuestions ?? []) as QualifyQuestion[],
    grossCpl: dollarsFromCents(row.grossCplCents),
    hostAmount: dollarsFromCents(row.hostAmountCents),
    platformAmount: dollarsFromCents(row.platformAmountCents),
    fundedBalance: dollarsFromCents(row.fundedBalanceCents),
    maxLeads: row.maxLeads,
    startsAt: iso(row.startsAt) ?? null,
    endsAt: iso(row.endsAt) ?? null,
    completionUrl: row.completionUrl,
  };
}

export async function listCampaigns() {
  const rows = await db().select().from(campaigns).orderBy(campaigns.name);
  const links = await db().select().from(campaignHosts);
  const byCampaign = new Map<string, string[]>();
  for (const link of links) {
    const current = byCampaign.get(link.campaignId) ?? [];
    current.push(link.hostId);
    byCampaign.set(link.campaignId, current);
  }
  return rows.map((row) => mapCampaign(row, byCampaign.get(row.id) ?? []));
}

export async function getCampaign(id: string) {
  const [row] = await db()
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!row) return null;
  return mapCampaign(row, await hostIdsForCampaign(id));
}

export async function campaignsForStartup(startupId: string) {
  return (await listCampaigns()).filter((campaign) => campaign.startupId === startupId);
}

export async function setCampaignHosts(campaignId: string, hostIds: string[]) {
  await db().delete(campaignHosts).where(eq(campaignHosts.campaignId, campaignId));
  if (hostIds.length === 0) return;
  await db().insert(campaignHosts).values(
    hostIds.map((hostId) => ({ campaignId, hostId })),
  );
}

export async function upsertCampaign(input: {
  id?: string;
  startupId: string;
  name: string;
  status?: CampaignStatus;
  headline?: string;
  valueProposition: string;
  eligibleHostIds?: string[];
  eligibleInterestIds?: Campaign["eligibleInterestIds"];
  questions?: QualifyQuestion[];
  grossCpl: number;
  hostAmount: number;
  platformAmount: number;
  fundedBalance?: number;
  maxLeads?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  completionUrl?: string | null;
}) {
  const id = input.id || slugify(`${input.name}-${input.startupId}`);
  await db()
    .insert(campaigns)
    .values({
      id,
      startupId: input.startupId,
      name: input.name,
      status: input.status ?? "paused",
      headline: input.headline ?? "TODAY'S SPONSOR",
      valueProposition: input.valueProposition,
      eligibleInterestIds: input.eligibleInterestIds ?? ["try", "useful", "later"],
      qualifyQuestions: input.questions ?? [],
      grossCplCents: centsFromDollars(input.grossCpl),
      hostAmountCents: centsFromDollars(input.hostAmount),
      platformAmountCents: centsFromDollars(input.platformAmount),
      fundedBalanceCents: centsFromDollars(input.fundedBalance ?? 0),
      maxLeads: input.maxLeads ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      completionUrl: input.completionUrl ?? null,
    })
    .onConflictDoUpdate({
      target: campaigns.id,
      set: {
        startupId: input.startupId,
        name: input.name,
        status: input.status ?? "paused",
        headline: input.headline ?? "TODAY'S SPONSOR",
        valueProposition: input.valueProposition,
        eligibleInterestIds: input.eligibleInterestIds ?? ["try", "useful", "later"],
        qualifyQuestions: input.questions ?? [],
        grossCplCents: centsFromDollars(input.grossCpl),
        hostAmountCents: centsFromDollars(input.hostAmount),
        platformAmountCents: centsFromDollars(input.platformAmount),
        fundedBalanceCents: centsFromDollars(input.fundedBalance ?? 0),
        maxLeads: input.maxLeads ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        completionUrl: input.completionUrl ?? null,
      },
    });
  if (input.eligibleHostIds) {
    await setCampaignHosts(id, input.eligibleHostIds);
  }
  return (await getCampaign(id))!;
}

export async function patchCampaign(
  id: string,
  patch: {
    status?: CampaignStatus;
    eligibleHostIds?: string[];
    fundedBalanceCents?: number;
    headline?: string;
    valueProposition?: string;
    completionUrl?: string | null;
    maxLeads?: number | null;
  },
) {
  const existing = await getCampaign(id);
  if (!existing) return null;

  const updates: Partial<typeof campaigns.$inferInsert> = {};
  if (patch.status) updates.status = patch.status;
  if (patch.headline) updates.headline = patch.headline;
  if (patch.valueProposition) updates.valueProposition = patch.valueProposition;
  if (patch.completionUrl !== undefined) updates.completionUrl = patch.completionUrl;
  if (patch.maxLeads !== undefined) updates.maxLeads = patch.maxLeads;
  if (patch.fundedBalanceCents !== undefined) {
    updates.fundedBalanceCents = patch.fundedBalanceCents;
  }
  if (Object.keys(updates).length > 0) {
    await db().update(campaigns).set(updates).where(eq(campaigns.id, id));
  }
  if (patch.eligibleHostIds) {
    await setCampaignHosts(id, patch.eligibleHostIds);
  }
  return getCampaign(id);
}

export async function creditCampaign(id: string, dollars: number) {
  const cents = centsFromDollars(dollars);
  await db()
    .update(campaigns)
    .set({
      fundedBalanceCents: sql`${campaigns.fundedBalanceCents} + ${cents}`,
    })
    .where(eq(campaigns.id, id));
  return getCampaign(id);
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

export { desc, eq, sql };

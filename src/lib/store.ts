import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  campaigns,
  consentReceipts,
  leadExports,
  leads,
  ledgerEntries,
  plays,
} from "@/db/schema";
import {
  answersMatchCampaign,
  CONSENT_VERSION,
  isEligibleInterest,
  type Campaign,
} from "@/lib/campaigns";
import { getCampaign } from "@/lib/catalog";
import { localDateInZone } from "@/lib/dates";
import { dollarsFromCents, iso, isoRequired } from "@/lib/money";
import { normalizeEmail, normalizePhone } from "@/lib/normalize";
import type { PawRecord } from "@/lib/paws";
import { rankPlay, type Play, type RankResult } from "@/lib/rank";
import { todaysSponsor } from "@/lib/route-campaign";
import { hashToken, newSecretToken } from "@/lib/tokens";

export type RecordedPlay = Play & RankResult;

export type LeadStatus =
  | "pending_verification"
  | "verified"
  | "duplicate"
  | "qualified";

export type Lead = {
  id: string;
  pawToken: string;
  hostId: string;
  startupId: string;
  campaignId: string;
  sessionId?: string;
  interestId: string;
  fullName: string;
  email: string;
  emailNormalized: string;
  phone: string;
  phoneNormalized: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  verifyTokenHash?: string;
  verifyExpiresAt: string;
  verificationEmailSentAt?: string;
  verificationEmailCount?: number;
  qualification: Record<string, string>;
  consentAt?: string;
  consentVersion?: string;
  status: LeadStatus;
  grossCpl?: number;
  hostAmount?: number;
  platformAmount?: number;
  createdAt: string;
  qualifiedAt?: string;
};

function mapPlay(row: typeof plays.$inferSelect): Play {
  return {
    id: row.id,
    pawToken: row.pawToken,
    hostId: row.hostId,
    challengeId: row.challengeId,
    localDate: row.localDate,
    correctCount: row.correctCount,
    totalResponseMs: row.totalResponseMs,
    rankingEligible: row.rankingEligible,
    createdAt: isoRequired(row.createdAt),
  };
}

function mapLead(row: typeof leads.$inferSelect): Lead {
  return {
    id: row.id,
    pawToken: row.pawToken,
    hostId: row.hostId,
    startupId: row.startupId,
    campaignId: row.campaignId,
    sessionId: row.sessionId ?? undefined,
    interestId: row.interestId,
    fullName: row.fullName,
    email: row.email,
    emailNormalized: row.emailNormalized,
    phone: row.phone,
    phoneNormalized: row.phoneNormalized,
    emailVerified: row.emailVerified,
    emailVerifiedAt: iso(row.emailVerifiedAt),
    verifyTokenHash: row.verifyTokenHash ?? undefined,
    verifyExpiresAt: iso(row.verifyExpiresAt) ?? new Date(0).toISOString(),
    verificationEmailSentAt: iso(row.verificationEmailSentAt),
    verificationEmailCount: row.verificationEmailCount,
    qualification: row.qualification ?? {},
    consentAt: iso(row.consentAt),
    consentVersion: row.consentVersion ?? undefined,
    status: row.status as LeadStatus,
    grossCpl: row.grossCplCents == null ? undefined : dollarsFromCents(row.grossCplCents),
    hostAmount:
      row.hostAmountCents == null ? undefined : dollarsFromCents(row.hostAmountCents),
    platformAmount:
      row.platformAmountCents == null
        ? undefined
        : dollarsFromCents(row.platformAmountCents),
    createdAt: isoRequired(row.createdAt),
    qualifiedAt: iso(row.qualifiedAt),
  };
}

export async function listPlays() {
  const rows = await db().select().from(plays).orderBy(desc(plays.createdAt));
  return rows.map(mapPlay);
}

export async function listLeads() {
  const rows = await db().select().from(leads).orderBy(desc(leads.createdAt));
  return rows.map(mapLead);
}

export async function recordPlay(input: {
  paw: PawRecord;
  challengeId: string;
  correctCount: number;
  totalResponseMs: number;
  sessionId?: string | null;
  deviceKey?: string | null;
}): Promise<RecordedPlay> {
  const localDate = localDateInZone(input.paw.timezone);
  let rankingEligible = true;
  if (input.deviceKey) {
    const prior = await db()
      .select({ id: plays.id })
      .from(plays)
      .where(
        and(
          eq(plays.hostId, input.paw.hostId),
          eq(plays.localDate, localDate),
          eq(plays.deviceKey, input.deviceKey),
          eq(plays.rankingEligible, true),
        ),
      )
      .limit(1);
    rankingEligible = prior.length === 0;
  }

  const play: Play = {
    id: randomUUID(),
    pawToken: input.paw.token,
    hostId: input.paw.hostId,
    challengeId: input.challengeId,
    localDate,
    correctCount: input.correctCount,
    totalResponseMs: input.totalResponseMs,
    rankingEligible,
    createdAt: new Date().toISOString(),
  };

  await db().insert(plays).values({
    id: play.id,
    pawToken: play.pawToken,
    hostId: play.hostId,
    challengeId: play.challengeId,
    sessionId: input.sessionId ?? null,
    localDate: play.localDate,
    correctCount: play.correctCount,
    totalResponseMs: play.totalResponseMs,
    rankingEligible,
    deviceKey: input.deviceKey ?? null,
  });

  const boardRows = await db()
    .select()
    .from(plays)
    .where(
      and(
        eq(plays.hostId, play.hostId),
        eq(plays.localDate, play.localDate),
        eq(plays.challengeId, play.challengeId),
      ),
    );
  const board = boardRows
    .map(mapPlay)
    .filter((entry) => entry.rankingEligible !== false || entry.id === play.id);

  return { ...play, ...rankPlay(board, play) };
}

async function isDuplicate(startupId: string, email: string, phone: string) {
  const rows = await db()
    .select()
    .from(leads)
    .where(and(eq(leads.startupId, startupId), eq(leads.status, "qualified")));
  return rows.some(
    (lead) => lead.emailNormalized === email || lead.phoneNormalized === phone,
  );
}

export async function createLead(input: {
  paw: PawRecord;
  campaign: Campaign;
  interestId: string;
  fullName: string;
  email: string;
  phone: string;
  sessionId?: string | null;
}): Promise<{ lead: Lead; verifyToken?: string }> {
  const routed = await todaysSponsor(input.paw);
  if (
    !routed ||
    routed.id !== input.campaign.id ||
    !isEligibleInterest(input.campaign, input.interestId)
  ) {
    throw new Error("Campaign not eligible");
  }

  const emailNormalized = normalizeEmail(input.email);
  const phoneNormalized = normalizePhone(input.phone);
  const duplicate = await isDuplicate(
    input.campaign.startupId,
    emailNormalized,
    phoneNormalized,
  );
  const now = Date.now();
  const verifyToken = duplicate ? undefined : newSecretToken();
  const id = randomUUID();

  await db().insert(leads).values({
    id,
    pawToken: input.paw.token,
    hostId: input.paw.hostId,
    startupId: input.campaign.startupId,
    campaignId: input.campaign.id,
    sessionId: input.sessionId ?? null,
    interestId: input.interestId,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    emailNormalized,
    phone: input.phone.trim(),
    phoneNormalized,
    emailVerified: false,
    verifyTokenHash: verifyToken ? hashToken(verifyToken) : null,
    verifyExpiresAt: new Date(now + 24 * 60 * 60 * 1000),
    qualification: {},
    status: duplicate ? "duplicate" : "pending_verification",
  });

  const lead = await getLead(id);
  if (!lead) throw new Error("Lead missing after insert");
  return { lead, verifyToken };
}

export async function verifyLead(token: string) {
  const hashed = hashToken(token);
  const [row] = await db()
    .select()
    .from(leads)
    .where(eq(leads.verifyTokenHash, hashed))
    .limit(1);
  if (!row) return { ok: false as const, reason: "missing" };
  const lead = mapLead(row);
  if (lead.status === "duplicate") {
    return { ok: false as const, reason: "duplicate", lead };
  }
  if (lead.emailVerified) {
    return { ok: true as const, lead };
  }
  if (new Date(lead.verifyExpiresAt).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired", lead };
  }

  await db()
    .update(leads)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: row.status === "pending_verification" ? "verified" : row.status,
    })
    .where(eq(leads.id, row.id));

  return { ok: true as const, lead: (await getLead(row.id))! };
}

const RESEND_GAP_MS = 45_000;
const RESEND_MAX = 8;

export async function markVerificationEmailSent(leadId: string) {
  const lead = await getLead(leadId);
  if (!lead) return null;
  await db()
    .update(leads)
    .set({
      verificationEmailSentAt: new Date(),
      verificationEmailCount: (lead.verificationEmailCount ?? 0) + 1,
    })
    .where(eq(leads.id, leadId));
  return getLead(leadId);
}

export async function rotateVerificationToken(input: {
  leadId: string;
  email?: string;
}): Promise<
  | { ok: true; lead: Lead; verifyToken: string }
  | { ok: false; reason: "missing" | "duplicate" | "verified" | "rate" }
> {
  const lead = await getLead(input.leadId);
  if (!lead) return { ok: false as const, reason: "missing" };
  if (lead.status === "duplicate") {
    return { ok: false as const, reason: "duplicate" };
  }
  if (lead.emailVerified) {
    return { ok: false as const, reason: "verified" };
  }

  const now = Date.now();
  if (
    lead.verificationEmailSentAt &&
    now - new Date(lead.verificationEmailSentAt).getTime() < RESEND_GAP_MS
  ) {
    return { ok: false as const, reason: "rate" };
  }
  if ((lead.verificationEmailCount ?? 0) >= RESEND_MAX && !input.email) {
    return { ok: false as const, reason: "rate" };
  }

  let email = lead.email;
  let emailNormalized = lead.emailNormalized;
  if (input.email) {
    emailNormalized = normalizeEmail(input.email);
    if (
      (await isDuplicate(lead.startupId, emailNormalized, lead.phoneNormalized)) &&
      emailNormalized !== lead.emailNormalized
    ) {
      return { ok: false as const, reason: "duplicate" };
    }
    email = input.email.trim();
  }

  const verifyToken = newSecretToken();
  await db()
    .update(leads)
    .set({
      email,
      emailNormalized,
      verifyTokenHash: hashToken(verifyToken),
      verifyExpiresAt: new Date(now + 24 * 60 * 60 * 1000),
      verificationEmailSentAt: new Date(now),
      verificationEmailCount: (lead.verificationEmailCount ?? 0) + 1,
    })
    .where(eq(leads.id, lead.id));

  return { ok: true as const, lead: (await getLead(lead.id))!, verifyToken };
}

export async function finishLead(input: {
  leadId: string;
  answers: Record<string, string>;
}) {
  return db().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(leads)
      .where(eq(leads.id, input.leadId))
      .limit(1);
    if (!row) return { ok: false as const, reason: "missing" };
    const lead = mapLead(row);
    if (lead.status === "duplicate") {
      return { ok: false as const, reason: "duplicate", lead };
    }
    if (lead.status === "qualified") {
      return { ok: true as const, lead };
    }
    if (!lead.emailVerified) {
      return { ok: false as const, reason: "unverified", lead };
    }

    const campaign = await getCampaign(lead.campaignId);
    if (!campaign || !answersMatchCampaign(campaign, input.answers)) {
      return { ok: false as const, reason: "qualification", lead };
    }

    const [fresh] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaign.id))
      .limit(1);
    if (!fresh) return { ok: false as const, reason: "qualification", lead };
    if (fresh.fundedBalanceCents < fresh.grossCplCents) {
      return { ok: false as const, reason: "budget", lead };
    }
    if (fresh.status !== "live") {
      return { ok: false as const, reason: "budget", lead };
    }

    const now = new Date();
    const remaining = fresh.fundedBalanceCents - fresh.grossCplCents;
    const pause = remaining < fresh.grossCplCents;

    await tx
      .update(leads)
      .set({
        qualification: input.answers,
        consentAt: now,
        consentVersion: CONSENT_VERSION,
        status: "qualified",
        grossCplCents: fresh.grossCplCents,
        hostAmountCents: fresh.hostAmountCents,
        platformAmountCents: fresh.platformAmountCents,
        qualifiedAt: now,
      })
      .where(eq(leads.id, lead.id));

    await tx
      .update(campaigns)
      .set({
        fundedBalanceCents: remaining,
        status: pause ? "paused" : fresh.status,
      })
      .where(eq(campaigns.id, campaign.id));

    await tx.insert(consentReceipts).values({
      id: randomUUID(),
      leadId: lead.id,
      startupId: lead.startupId,
      version: CONSENT_VERSION,
      text: `Share name, email, phone, and responses with ${campaign.name} so they can follow up.`,
      fields: "fullName,email,phone,qualification",
    });

    await tx.insert(ledgerEntries).values([
      {
        id: randomUUID(),
        kind: "startup_spend",
        amountCents: fresh.grossCplCents,
        startupId: lead.startupId,
        campaignId: campaign.id,
        leadId: lead.id,
        hostId: lead.hostId,
        status: "posted",
        note: `${campaign.name} qualified introduction`,
      },
      {
        id: randomUUID(),
        kind: "host_earning",
        amountCents: fresh.hostAmountCents,
        hostId: lead.hostId,
        startupId: lead.startupId,
        campaignId: campaign.id,
        leadId: lead.id,
        status: "potential",
        note: `${campaign.name} introduction`,
      },
      {
        id: randomUUID(),
        kind: "platform_share",
        amountCents: fresh.platformAmountCents,
        startupId: lead.startupId,
        campaignId: campaign.id,
        leadId: lead.id,
        hostId: lead.hostId,
        status: "posted",
        note: "Platform share",
      },
    ]);

    return {
      ok: true as const,
      lead: {
        ...lead,
        qualification: input.answers,
        consentAt: now.toISOString(),
        consentVersion: CONSENT_VERSION,
        status: "qualified" as const,
        grossCpl: dollarsFromCents(fresh.grossCplCents),
        hostAmount: dollarsFromCents(fresh.hostAmountCents),
        platformAmount: dollarsFromCents(fresh.platformAmountCents),
        qualifiedAt: now.toISOString(),
      },
    };
  });
}

export async function getLead(leadId: string) {
  const [row] = await db().select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return row ? mapLead(row) : null;
}

export type LeadExport = {
  id: string;
  startupId: string;
  createdAt: string;
  leadCount: number;
};

export async function listExports(startupId: string) {
  const rows = await db()
    .select()
    .from(leadExports)
    .where(eq(leadExports.startupId, startupId))
    .orderBy(desc(leadExports.createdAt));
  return rows.map((row) => ({
    id: row.id,
    startupId: row.startupId,
    createdAt: isoRequired(row.createdAt),
    leadCount: row.leadCount,
  }));
}

export async function recordExport(startupId: string, leadCount: number) {
  const row = {
    id: randomUUID(),
    startupId,
    leadCount,
    createdAt: new Date(),
  };
  await db().insert(leadExports).values(row);
  return {
    id: row.id,
    startupId,
    createdAt: row.createdAt.toISOString(),
    leadCount,
  };
}

export async function listLedger(hostId?: string) {
  const rows = hostId
    ? await db()
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.hostId, hostId))
        .orderBy(desc(ledgerEntries.createdAt))
    : await db()
        .select()
        .from(ledgerEntries)
        .orderBy(desc(ledgerEntries.createdAt));
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    amount: dollarsFromCents(row.amountCents),
    hostId: row.hostId,
    startupId: row.startupId,
    campaignId: row.campaignId,
    leadId: row.leadId,
    status: row.status,
    note: row.note,
    createdAt: isoRequired(row.createdAt),
  }));
}

export async function markHostEarningPaid(entryId: string) {
  await db()
    .update(ledgerEntries)
    .set({ status: "paid" })
    .where(and(eq(ledgerEntries.id, entryId), eq(ledgerEntries.kind, "host_earning")));
}

export async function markHostEarningsPending(hostId: string) {
  await db()
    .update(ledgerEntries)
    .set({ status: "pending" })
    .where(
      and(
        eq(ledgerEntries.hostId, hostId),
        eq(ledgerEntries.kind, "host_earning"),
        eq(ledgerEntries.status, "potential"),
      ),
    );
}

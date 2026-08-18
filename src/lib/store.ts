import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  answersMatchCampaign,
  CONSENT_VERSION,
  isEligibleInterest,
  type Campaign,
} from "@/lib/campaigns";
import { getCampaign } from "@/lib/campaign-resolve";
import { dataFile } from "@/lib/data-dir";
import { localDateInZone } from "@/lib/dates";
import type { PawRecord } from "@/lib/paws";
import { rankPlay, type Play, type RankResult } from "@/lib/rank";
import { todaysSponsor } from "@/lib/route-campaign";
import { hashToken, newSecretToken } from "@/lib/tokens";
import { normalizeEmail, normalizePhone } from "@/lib/normalize";

const PLAYS_FILE = dataFile("plays.json");
const LEADS_FILE = dataFile("leads.json");
const EXPORTS_FILE = dataFile("exports.json");

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>) {
  const run = queue.then(work, work);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

export type RecordedPlay = Play & RankResult;

export async function recordPlay(input: {
  paw: PawRecord;
  challengeId: string;
  correctCount: number;
  totalResponseMs: number;
}): Promise<RecordedPlay> {
  return enqueue(async () => {
    const play: Play = {
      id: randomUUID(),
      pawToken: input.paw.token,
      hostId: input.paw.hostId,
      challengeId: input.challengeId,
      localDate: localDateInZone(input.paw.timezone),
      correctCount: input.correctCount,
      totalResponseMs: input.totalResponseMs,
      createdAt: new Date().toISOString(),
    };

    const plays = await readJson<Play[]>(PLAYS_FILE, []);
    plays.push(play);
    await writeJson(PLAYS_FILE, plays);

    return { ...play, ...rankPlay(plays, play) };
  });
}

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
  interestId: string;
  fullName: string;
  email: string;
  emailNormalized: string;
  phone: string;
  phoneNormalized: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  verifyToken?: string;
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

function isDuplicate(
  leads: Lead[],
  startupId: string,
  email: string,
  phone: string,
) {
  return leads.some(
    (lead) =>
      lead.startupId === startupId &&
      lead.status === "qualified" &&
      (lead.emailNormalized === email || lead.phoneNormalized === phone),
  );
}

export async function createLead(input: {
  paw: PawRecord;
  campaign: Campaign;
  interestId: string;
  fullName: string;
  email: string;
  phone: string;
}): Promise<{ lead: Lead; verifyToken?: string }> {
  return enqueue(async () => {
    const routed = todaysSponsor(input.paw);
    if (
      !routed ||
      routed.id !== input.campaign.id ||
      !isEligibleInterest(input.campaign, input.interestId)
    ) {
      throw new Error("Campaign not eligible");
    }

    const emailNormalized = normalizeEmail(input.email);
    const phoneNormalized = normalizePhone(input.phone);
    const leads = await readJson<Lead[]>(LEADS_FILE, []);
    const duplicate = isDuplicate(
      leads,
      input.campaign.startupId,
      emailNormalized,
      phoneNormalized,
    );
    const now = Date.now();
    const verifyToken = duplicate ? undefined : newSecretToken();

    const lead: Lead = {
      id: randomUUID(),
      pawToken: input.paw.token,
      hostId: input.paw.hostId,
      startupId: input.campaign.startupId,
      campaignId: input.campaign.id,
      interestId: input.interestId,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      emailNormalized,
      phone: input.phone.trim(),
      phoneNormalized,
      emailVerified: false,
      verifyTokenHash: verifyToken ? hashToken(verifyToken) : undefined,
      verifyExpiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      qualification: {},
      status: duplicate ? "duplicate" : "pending_verification",
      createdAt: new Date(now).toISOString(),
    };

    leads.push(lead);
    await writeJson(LEADS_FILE, leads);
    return { lead, verifyToken };
  });
}

export async function verifyLead(token: string) {
  return enqueue(async () => {
    const hashed = hashToken(token);
    const leads = await readJson<Lead[]>(LEADS_FILE, []);
    const lead = leads.find(
      (entry) =>
        entry.verifyTokenHash === hashed || entry.verifyToken === token,
    );
    if (!lead) return { ok: false as const, reason: "missing" };
    if (lead.status === "duplicate") {
      return { ok: false as const, reason: "duplicate", lead };
    }
    if (lead.emailVerified) {
      return { ok: true as const, lead };
    }
    if (new Date(lead.verifyExpiresAt).getTime() < Date.now()) {
      return { ok: false as const, reason: "expired", lead };
    }

    lead.emailVerified = true;
    lead.emailVerifiedAt = new Date().toISOString();
    if (lead.status === "pending_verification") lead.status = "verified";
    await writeJson(LEADS_FILE, leads);
    return { ok: true as const, lead };
  });
}

const RESEND_GAP_MS = 45_000;
const RESEND_MAX = 8;

function issueToken(lead: Lead, now: number) {
  const verifyToken = newSecretToken();
  lead.verifyToken = undefined;
  lead.verifyTokenHash = hashToken(verifyToken);
  lead.verifyExpiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  return verifyToken;
}

export async function markVerificationEmailSent(leadId: string) {
  return enqueue(async () => {
    const leads = await readJson<Lead[]>(LEADS_FILE, []);
    const lead = leads.find((entry) => entry.id === leadId);
    if (!lead) return null;
    lead.verificationEmailSentAt = new Date().toISOString();
    lead.verificationEmailCount = (lead.verificationEmailCount ?? 0) + 1;
    await writeJson(LEADS_FILE, leads);
    return lead;
  });
}

export async function rotateVerificationToken(input: {
  leadId: string;
  email?: string;
}): Promise<
  | { ok: true; lead: Lead; verifyToken: string }
  | { ok: false; reason: "missing" | "duplicate" | "verified" | "rate" }
> {
  return enqueue(async () => {
    const leads = await readJson<Lead[]>(LEADS_FILE, []);
    const lead = leads.find((entry) => entry.id === input.leadId);
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

    if (input.email) {
      const emailNormalized = normalizeEmail(input.email);
      if (
        isDuplicate(leads, lead.startupId, emailNormalized, lead.phoneNormalized) &&
        emailNormalized !== lead.emailNormalized
      ) {
        return { ok: false as const, reason: "duplicate" };
      }
      lead.email = input.email.trim();
      lead.emailNormalized = emailNormalized;
    }

    const verifyToken = issueToken(lead, now);
    lead.verificationEmailSentAt = new Date(now).toISOString();
    lead.verificationEmailCount = (lead.verificationEmailCount ?? 0) + 1;
    await writeJson(LEADS_FILE, leads);
    return { ok: true as const, lead, verifyToken };
  });
}

export async function finishLead(input: {
  leadId: string;
  answers: Record<string, string>;
}) {
  return enqueue(async () => {
    const leads = await readJson<Lead[]>(LEADS_FILE, []);
    const lead = leads.find((entry) => entry.id === input.leadId);
    if (!lead) return { ok: false as const, reason: "missing" };
    if (lead.status === "duplicate") {
      return { ok: false as const, reason: "duplicate", lead };
    }
    if (!lead.emailVerified) {
      return { ok: false as const, reason: "unverified", lead };
    }

    const campaign = getCampaign(lead.campaignId);
    if (!campaign || !answersMatchCampaign(campaign, input.answers)) {
      return { ok: false as const, reason: "qualification", lead };
    }

    lead.qualification = input.answers;
    lead.consentAt = new Date().toISOString();
    lead.consentVersion = CONSENT_VERSION;
    lead.status = "qualified";
    lead.grossCpl = campaign.grossCpl;
    lead.hostAmount = campaign.hostAmount;
    lead.platformAmount = campaign.platformAmount;
    lead.qualifiedAt = lead.consentAt;
    await writeJson(LEADS_FILE, leads);
    return { ok: true as const, lead };
  });
}

export async function getLead(leadId: string) {
  const leads = await readJson<Lead[]>(LEADS_FILE, []);
  return leads.find((lead) => lead.id === leadId) ?? null;
}

export async function listPlays() {
  return readJson<Play[]>(PLAYS_FILE, []);
}

export async function listLeads() {
  return readJson<Lead[]>(LEADS_FILE, []);
}

export type LeadExport = {
  id: string;
  startupId: string;
  createdAt: string;
  leadCount: number;
};

export async function listExports(startupId: string) {
  const rows = await readJson<LeadExport[]>(EXPORTS_FILE, []);
  return rows
    .filter((row) => row.startupId === startupId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function recordExport(startupId: string, leadCount: number) {
  return enqueue(async () => {
    const rows = await readJson<LeadExport[]>(EXPORTS_FILE, []);
    const row: LeadExport = {
      id: randomUUID(),
      startupId,
      createdAt: new Date().toISOString(),
      leadCount,
    };
    rows.push(row);
    await writeJson(EXPORTS_FILE, rows);
    return row;
  });
}

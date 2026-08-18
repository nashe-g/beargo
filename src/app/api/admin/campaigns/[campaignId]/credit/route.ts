import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { creditCampaign } from "@/lib/catalog";
import { centsFromDollars } from "@/lib/money";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { randomUUID } from "node:crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { campaignId } = await context.params;
  const body = (await request.json()) as { amount?: number };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const campaign = await creditCampaign(campaignId, amount);
  await db().insert(ledgerEntries).values({
    id: randomUUID(),
    kind: "campaign_credit",
    amountCents: centsFromDollars(amount),
    campaignId,
    startupId: campaign?.startupId,
    status: "posted",
    note: "Admin credit",
  });
  await audit("admin", "campaign.credit", { campaignId, amount });
  return NextResponse.json({ campaign });
}

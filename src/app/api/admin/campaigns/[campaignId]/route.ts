import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { getCampaign, patchCampaign } from "@/lib/campaign-resolve";
import type { CampaignStatus } from "@/lib/campaigns";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/campaigns/[campaignId]">,
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { campaignId } = await context.params;
  if (!getCampaign(campaignId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as {
    status?: unknown;
    eligibleHostIds?: unknown;
  };

  const patch: {
    status?: CampaignStatus;
    eligibleHostIds?: string[];
  } = {};

  if (
    record.status === "live" ||
    record.status === "paused" ||
    record.status === "ended"
  ) {
    patch.status = record.status;
  }

  if (Array.isArray(record.eligibleHostIds)) {
    patch.eligibleHostIds = record.eligibleHostIds.map((id) => String(id));
  }

  const campaign = patchCampaign(campaignId, patch);
  return NextResponse.json({ campaign });
}

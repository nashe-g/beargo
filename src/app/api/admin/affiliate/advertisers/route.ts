import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { createAffiliateAdvertiser } from "@/lib/affiliate";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    name?: string;
    networkAdvertiserId?: string;
    relationshipStatus?: string;
    active?: boolean;
  };
  const result = await createAffiliateAdvertiser({
    name: String(body.name ?? ""),
    networkAdvertiserId: body.networkAdvertiserId,
    relationshipStatus: body.relationshipStatus === "joined" ? "joined" : "pending",
    active: Boolean(body.active),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await audit("admin", "affiliate.advertiser.create", { id: result.id });
  return NextResponse.json(result);
}

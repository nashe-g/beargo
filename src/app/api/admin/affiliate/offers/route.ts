import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { createAffiliateOffer } from "@/lib/affiliate";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    advertiserId?: string;
    title?: string;
    body?: string;
    ctaLabel?: string;
    affiliateClickUrl?: string;
    advertiserDestination?: string;
    imageUrl?: string;
    sourceLinkId?: string;
    startsAt?: string;
    endsAt?: string;
    adminWeight?: number;
    complianceReviewed?: boolean;
    active?: boolean;
  };
  const result = await createAffiliateOffer({
    advertiserId: String(body.advertiserId ?? ""),
    title: String(body.title ?? ""),
    body: String(body.body ?? ""),
    ctaLabel: String(body.ctaLabel ?? ""),
    affiliateClickUrl: String(body.affiliateClickUrl ?? ""),
    advertiserDestination: body.advertiserDestination,
    imageUrl: body.imageUrl,
    sourceLinkId: body.sourceLinkId,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    adminWeight: Number(body.adminWeight ?? 1),
    complianceReviewed: Boolean(body.complianceReviewed),
    active: Boolean(body.active),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await audit("admin", "affiliate.offer.create", { id: result.id });
  return NextResponse.json(result);
}

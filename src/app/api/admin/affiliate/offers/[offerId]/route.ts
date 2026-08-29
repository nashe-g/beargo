import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { setAffiliateOfferActive } from "@/lib/affiliate";
import { audit } from "@/lib/audit";

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { offerId } = await context.params;
  const body = (await request.json()) as { active?: boolean };
  await setAffiliateOfferActive(offerId, Boolean(body.active));
  await audit("admin", "affiliate.offer.toggle", {
    id: offerId,
    active: Boolean(body.active),
  });
  return NextResponse.json({ ok: true });
}

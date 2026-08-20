import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { cancelPromotion } from "@/lib/promotions";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/admin/promotions/[promotionId]/cancel">,
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { promotionId } = await context.params;
  const promotion = await cancelPromotion(promotionId);
  if (!promotion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await audit("admin", "promotions.cancel", { id: promotion.id });
  return NextResponse.json({ ok: true, status: promotion.status });
}

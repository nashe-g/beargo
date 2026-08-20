import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { upsertUser } from "@/lib/auth";
import { createOffer, type OfferDraft } from "@/lib/create-offer";
import { resolvePromotionCategory } from "@/lib/offer";
import { upsertMerchant } from "@/lib/promotions";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as OfferDraft & {
    merchantName?: string;
    email?: string;
    testMode?: boolean;
  };

  const merchantName = String(body.merchantName ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!merchantName || !email.includes("@")) {
    return NextResponse.json(
      { error: "Business name and login email required" },
      { status: 400 },
    );
  }
  const category = resolvePromotionCategory(
    String(body.category ?? "entertainment"),
    String(body.categoryOther ?? ""),
  );
  if (!category) {
    return NextResponse.json(
      { error: "Pick a category, or type one under Other." },
      { status: 400 },
    );
  }

  const merchant = await upsertMerchant({
    displayName: merchantName,
    category,
  });
  const created = await createOffer({
    merchant,
    draft: body,
    testMode: Boolean(body.testMode),
    status: "live",
  });
  if ("error" in created) {
    return NextResponse.json(
      { error: created.error },
      { status: created.status },
    );
  }
  await upsertUser({
    email,
    role: "merchant",
    merchantId: merchant.id,
  });
  await audit("admin", "promotions.create", { id: created.promotion.id });
  return NextResponse.json({ promotion: created.promotion });
}

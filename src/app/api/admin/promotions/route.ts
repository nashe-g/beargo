import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { upsertUser } from "@/lib/auth";
import { centsFromDollars } from "@/lib/money";
import { PROMOTION_CATEGORIES, type DiscountType, type TeaserMode } from "@/lib/offer";
import { upsertLocation, upsertMerchant, upsertPromotion } from "@/lib/promotions";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    merchantName?: string;
    email?: string;
    category?: string;
    address?: string;
    city?: string;
    neighborhood?: string;
    lat?: number;
    lng?: number;
    discountType?: DiscountType;
    discountAmount?: number;
    discountPercent?: number;
    minimumPurchase?: number;
    maxDiscount?: number;
    radiusMiles?: number;
    teaserMode?: TeaserMode;
    shortTerms?: string;
    testMode?: boolean;
  };

  const merchantName = String(body.merchantName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const address = String(body.address ?? "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const category = String(body.category ?? "entertainment");
  const allowed = new Set(PROMOTION_CATEGORIES.map((row) => row.id));
  if (!merchantName || !email.includes("@")) {
    return NextResponse.json(
      { error: "Business name and login email required" },
      { status: 400 },
    );
  }
  if (!allowed.has(category as (typeof PROMOTION_CATEGORIES)[number]["id"])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Address and coordinates required" },
      { status: 400 },
    );
  }

  const discountType: DiscountType =
    body.discountType === "percentage" ? "percentage" : "fixed";
  const minimumPurchaseCents = centsFromDollars(Number(body.minimumPurchase ?? 0));
  if (minimumPurchaseCents <= 0) {
    return NextResponse.json(
      { error: "Minimum purchase required" },
      { status: 400 },
    );
  }

  const merchant = await upsertMerchant({
    displayName: merchantName,
    category,
  });
  const location = await upsertLocation({
    merchantId: merchant.id,
    name: merchantName,
    address,
    city: String(body.city ?? "Houston"),
    neighborhood: body.neighborhood || null,
    lat,
    lng,
  });
  const promotion = await upsertPromotion({
    merchantId: merchant.id,
    locationId: location.id,
    status: "live",
    discountType,
    discountAmountCents:
      discountType === "fixed"
        ? centsFromDollars(Number(body.discountAmount ?? 0))
        : null,
    discountPercent:
      discountType === "percentage" ? Number(body.discountPercent ?? 0) : null,
    minimumPurchaseCents,
    maxDiscountCents:
      discountType === "percentage" && Number(body.maxDiscount)
        ? centsFromDollars(Number(body.maxDiscount))
        : null,
    category,
    teaserMode:
      body.teaserMode === "merchant_visible"
        ? "merchant_visible"
        : "merchant_hidden",
    shortTerms: String(body.shortTerms ?? "").trim(),
    radiusMiles: Number(body.radiusMiles ?? 1.5) || 1.5,
    testMode: Boolean(body.testMode),
  });
  await upsertUser({
    email,
    role: "merchant",
    merchantId: merchant.id,
  });
  await audit("admin", "promotions.create", { id: promotion.id });
  return NextResponse.json({ promotion });
}

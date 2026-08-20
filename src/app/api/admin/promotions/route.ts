import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { upsertUser } from "@/lib/auth";
import { centsFromDollars } from "@/lib/money";
import { type DiscountType, type TeaserMode, resolvePromotionCategory } from "@/lib/offer";
import { upsertLocation, upsertMerchant, upsertPromotion } from "@/lib/promotions";
import { endOfLocalDays, parseZonedDateTime } from "@/lib/zoned";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    merchantName?: string;
    email?: string;
    category?: string;
    categoryOther?: string;
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
    validMode?: "days" | "until";
    validDays?: number | string;
    endDate?: string;
    endTime?: string;
    teaserMode?: TeaserMode;
    shortTerms?: string;
    testMode?: boolean;
  };

  const merchantName = String(body.merchantName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const address = String(body.address ?? "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const category = resolvePromotionCategory(
    String(body.category ?? "entertainment"),
    String(body.categoryOther ?? ""),
  );
  if (!merchantName || !email.includes("@")) {
    return NextResponse.json(
      { error: "Business name and login email required" },
      { status: 400 },
    );
  }
  if (!category) {
    return NextResponse.json(
      { error: "Pick a category, or type one under Other." },
      { status: 400 },
    );
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

  const validMode = body.validMode === "until" ? "until" : "days";
  let endsAt: Date | null = null;
  if (validMode === "days") {
    const days = Number(body.validDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Offer length must be a whole number of days from 1 to 365." },
        { status: 400 },
      );
    }
    endsAt = endOfLocalDays(location.timezone, days);
  } else {
    endsAt = parseZonedDateTime(
      location.timezone,
      String(body.endDate ?? ""),
      String(body.endTime ?? ""),
    );
    if (!endsAt) {
      return NextResponse.json(
        { error: "Pick an end date and time." },
        { status: 400 },
      );
    }
  }
  if (endsAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Offer end must be in the future." },
      { status: 400 },
    );
  }

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
    startsAt: new Date(),
    endsAt,
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

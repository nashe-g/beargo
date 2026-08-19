import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ledgerEntries, promotions, vouchers } from "@/db/schema";
import { isoRequired } from "@/lib/money";
import { BEARGO_FEE_CENTS, discountForSubtotal, type VoucherStatus } from "@/lib/offer";
import { getPromotion, remainingRedemptions, type PromotionRecord } from "@/lib/promotions";
import { nextLocalHour } from "@/lib/zoned";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type VoucherRecord = {
  id: string;
  token: string;
  code: string;
  playerId?: string | null;
  promotionId: string;
  merchantId: string;
  locationId: string;
  hostId: string;
  pawToken: string;
  status: VoucherStatus;
  claimedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  purchaseSubtotalCents?: number | null;
  discountAppliedCents?: number | null;
};

function mapVoucher(row: typeof vouchers.$inferSelect): VoucherRecord {
  return {
    id: row.id,
    token: row.token,
    code: row.code,
    playerId: row.playerId,
    promotionId: row.promotionId,
    merchantId: row.merchantId,
    locationId: row.locationId,
    hostId: row.hostId,
    pawToken: row.pawToken,
    status: row.status as VoucherStatus,
    claimedAt: isoRequired(row.claimedAt),
    expiresAt: isoRequired(row.expiresAt),
    redeemedAt: row.redeemedAt ? isoRequired(row.redeemedAt) : undefined,
    purchaseSubtotalCents: row.purchaseSubtotalCents,
    discountAppliedCents: row.discountAppliedCents,
  };
}

function randomCode() {
  const bytes = randomBytes(5);
  let body = "";
  for (const byte of bytes) {
    body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `BG-${body}`;
}

export async function getVoucherByToken(token: string) {
  const [row] = await db()
    .select()
    .from(vouchers)
    .where(eq(vouchers.token, token))
    .limit(1);
  return row ? mapVoucher(row) : null;
}

export async function getVoucherByCode(code: string) {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const [row] = await db()
    .select()
    .from(vouchers)
    .where(eq(vouchers.code, normalized))
    .limit(1);
  return row ? mapVoucher(row) : null;
}

export async function claimedVoucherForDevice(
  promotionId: string,
  deviceKey: string,
) {
  const [row] = await db()
    .select()
    .from(vouchers)
    .where(
      and(
        eq(vouchers.promotionId, promotionId),
        eq(vouchers.deviceKey, deviceKey),
        eq(vouchers.status, "claimed"),
      ),
    )
    .limit(1);
  return row ? mapVoucher(row) : null;
}

export async function getVoucher(id: string) {
  const [row] = await db().select().from(vouchers).where(eq(vouchers.id, id)).limit(1);
  return row ? mapVoucher(row) : null;
}

export async function activeVoucherForDevice(deviceKey: string, hostId?: string) {
  const rows = await db()
    .select()
    .from(vouchers)
    .where(
      and(eq(vouchers.deviceKey, deviceKey), eq(vouchers.status, "claimed")),
    )
    .orderBy(desc(vouchers.claimedAt));
  const live = rows
    .map(mapVoucher)
    .filter((voucher) => new Date(voucher.expiresAt).getTime() > Date.now())
    .filter((voucher) => (hostId ? voucher.hostId === hostId : true));
  return live[0] ?? null;
}

export async function listVouchersForMerchant(merchantId: string) {
  const rows = await db()
    .select()
    .from(vouchers)
    .where(eq(vouchers.merchantId, merchantId))
    .orderBy(desc(vouchers.claimedAt));
  return rows.map(mapVoucher);
}

function liveStatus(voucher: VoucherRecord): VoucherStatus {
  if (voucher.status !== "claimed") return voucher.status;
  if (new Date(voucher.expiresAt).getTime() < Date.now()) return "expired";
  return "claimed";
}

export async function claimVoucher(input: {
  promotion: PromotionRecord;
  hostId: string;
  pawToken: string;
  sessionId?: string | null;
  deviceKey?: string | null;
  playerId?: string | null;
}) {
  if (input.deviceKey) {
    const [existing] = await db()
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.promotionId, input.promotion.id),
          eq(vouchers.deviceKey, input.deviceKey),
          eq(vouchers.status, "claimed"),
        ),
      )
      .limit(1);
    if (existing) return mapVoucher(existing);
  }

  const remaining = await remainingRedemptions(input.promotion);
  if (remaining <= 0) {
    throw new Error("This offer is no longer available.");
  }

  const expiresAt = nextLocalHour(
    input.promotion.location.timezone,
    input.promotion.voucherExpireHour,
  );

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = randomUUID();
    const token = randomBytes(18).toString("hex");
    const code = randomCode();
    try {
      await db().insert(vouchers).values({
        id,
        token,
        code,
        promotionId: input.promotion.id,
        merchantId: input.promotion.merchantId,
        locationId: input.promotion.locationId,
        hostId: input.hostId,
        pawToken: input.pawToken,
        sessionId: input.sessionId ?? null,
        deviceKey: input.deviceKey ?? null,
        playerId: input.playerId ?? null,
        status: "claimed",
        expiresAt,
      });
      const created = await getVoucher(id);
      if (!created) throw new Error("Could not create voucher");
      return created;
    } catch {
      continue;
    }
  }
  throw new Error("Could not create voucher");
}

export async function previewRedemption(input: {
  voucher: VoucherRecord;
  merchantId: string;
  subtotalCents?: number | null;
}) {
  const promotion = await getPromotion(input.voucher.promotionId);
  if (!promotion) {
    return { ok: false as const, error: "Offer no longer exists." };
  }
  if (input.voucher.merchantId !== input.merchantId) {
    return { ok: false as const, error: "This voucher belongs to another business." };
  }
  const status = liveStatus(input.voucher);
  if (status === "redeemed") {
    return { ok: false as const, error: "Already redeemed." };
  }
  if (status === "expired") {
    return { ok: false as const, error: "This voucher has expired." };
  }
  if (status !== "claimed") {
    return { ok: false as const, error: "This voucher can’t be redeemed." };
  }

  let discountCents: number | null = null;
  if (promotion.discountType === "fixed") {
    discountCents = promotion.discountAmountCents ?? 0;
  }
  if (
    promotion.discountType === "percentage" &&
    input.subtotalCents != null &&
    Number.isFinite(input.subtotalCents)
  ) {
    const computed = discountForSubtotal({
      ...promotion,
      subtotalCents: input.subtotalCents,
    });
    discountCents = computed.ok ? computed.discountCents : 0;
  }

  return {
    ok: true as const,
    promotion,
    voucher: { ...input.voucher, status },
    discountCents,
  };
}

export async function redeemVoucher(input: {
  voucherId: string;
  merchantId: string;
  userId?: string | null;
  subtotalCents?: number | null;
}) {
  return db().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(vouchers)
      .where(eq(vouchers.id, input.voucherId))
      .limit(1);
    if (!row) return { ok: false as const, error: "Voucher not found." };
    const voucher = mapVoucher(row);
    const preview = await previewRedemption({
      voucher,
      merchantId: input.merchantId,
      subtotalCents: input.subtotalCents,
    });
    if (!preview.ok) return preview;

    if (row.status === "redeemed") {
      return { ok: false as const, error: "Already redeemed." };
    }

    if (preview.promotion.discountType === "percentage") {
      if (input.subtotalCents == null) {
        return { ok: false as const, error: "Enter the purchase subtotal." };
      }
      if (input.subtotalCents < preview.promotion.minimumPurchaseCents) {
        return {
          ok: false as const,
          error: `Purchase must be at least $${(preview.promotion.minimumPurchaseCents / 100).toFixed(2)}.`,
        };
      }
    }

    const discountCents =
      preview.discountCents ??
      (preview.promotion.discountType === "fixed"
        ? preview.promotion.discountAmountCents ?? 0
        : 0);

    await tx
      .update(vouchers)
      .set({
        status: "redeemed",
        redeemedAt: new Date(),
        redeemedByUserId: input.userId ?? null,
        redeemedLocationId: preview.promotion.locationId,
        purchaseSubtotalCents: input.subtotalCents ?? null,
        discountAppliedCents: discountCents,
      })
      .where(and(eq(vouchers.id, row.id), eq(vouchers.status, "claimed")));

    const [updated] = await tx
      .select()
      .from(vouchers)
      .where(eq(vouchers.id, row.id))
      .limit(1);
    if (!updated || updated.status !== "redeemed") {
      return { ok: false as const, error: "Already redeemed." };
    }

    const billed =
      preview.promotion.testMode || !preview.promotion.merchant.billingEnabled
        ? false
        : true;

    if (billed) {
      await tx
        .insert(ledgerEntries)
        .values({
          id: randomUUID(),
          kind: "merchant_fee",
          amountCents: BEARGO_FEE_CENTS,
          merchantId: input.merchantId,
          promotionId: preview.promotion.id,
          voucherId: row.id,
          status: "accrued",
          note: "Verified in-person redemption",
        })
        .onConflictDoNothing();
    }

    if (preview.promotion.maxRedemptions != null) {
      const [countRow] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.promotionId, preview.promotion.id),
            eq(vouchers.status, "redeemed"),
          ),
        );
      if ((countRow?.count ?? 0) >= preview.promotion.maxRedemptions) {
        await tx
          .update(promotions)
          .set({ status: "capped" })
          .where(eq(promotions.id, preview.promotion.id));
      }
    }

    return {
      ok: true as const,
      voucher: mapVoucher(updated),
      promotion: preview.promotion,
      discountCents,
      billed,
      feeCents: billed ? BEARGO_FEE_CENTS : 0,
    };
  });
}

export async function merchantFeeTotal(merchantId: string) {
  const [row] = await db()
    .select({
      total: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)::int`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.merchantId, merchantId),
        eq(ledgerEntries.kind, "merchant_fee"),
      ),
    );
  return row?.total ?? 0;
}

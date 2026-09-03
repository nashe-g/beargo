import Link from "next/link";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { VoucherQr } from "@/components/scanner/VoucherQr";
import { CANONICAL_ORIGIN } from "@/lib/config";
import { formatStamp } from "@/lib/format";
import { offerTitle } from "@/lib/offer";
import { hubPath } from "@/lib/play-kind";
import type { PromotionRecord } from "@/lib/promotions";
import type { VoucherRecord } from "@/lib/vouchers";

export function VoucherTicket({
  voucher,
  promotion,
  origin = CANONICAL_ORIGIN,
}: {
  voucher: VoucherRecord;
  promotion: PromotionRecord;
  origin?: string;
}) {
  const redeemUrl = `${origin.replace(/\/$/, "")}/r/${voucher.token}`;
  const expired = new Date(voucher.expiresAt).getTime() < Date.now();
  const status =
    voucher.status === "redeemed"
      ? "Redeemed"
      : expired
        ? "Expired"
        : "Show this when you pay";

  return (
    <ScannerShell homeHref={hubPath(voucher.pawToken)}>
      <div className="flex min-h-0 flex-1 flex-col items-center py-4 text-center">
        <p className="text-xs tracking-[0.22em] text-honey uppercase">
          BearGo voucher
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight">
          {offerTitle(promotion)}
        </h1>
        <p className="mt-3 text-lg text-paper/80">
          {promotion.merchant.displayName}
        </p>
        <p className="mt-1 text-sm text-paper/55">
          Valid through {formatStamp(voucher.expiresAt, promotion.location.timezone)}
        </p>
        <div className="mt-6 w-full rounded-[2rem] bg-paper px-5 py-6 text-ink">
          <VoucherQr value={redeemUrl} label="BearGo voucher" />
          <p className="mt-5 font-condensed text-3xl tracking-[0.18em]">
            {voucher.code}
          </p>
          <p className="mt-2 text-sm text-ink-soft">{status}</p>
        </div>
        {promotion.shortTerms ? (
          <p className="mt-6 max-w-sm text-sm text-paper/60">
            {promotion.shortTerms}
          </p>
        ) : null}
        <p className="mt-auto pt-6 text-sm text-paper/45">
          Screenshot this if you want to keep it.
        </p>
        <Link
          href={hubPath(voucher.pawToken)}
          className="mt-3 flex h-10 items-center justify-center text-sm text-paper/45"
        >
          Tonight
        </Link>
      </div>
    </ScannerShell>
  );
}

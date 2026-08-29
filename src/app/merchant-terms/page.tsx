import { PublicShell } from "@/components/public/PublicShell";

export default function MerchantTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Legacy merchant terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          These terms apply only to the legacy direct voucher program, which
          is not open to new merchants. They are not terms for CJ advertisers
          or other affiliate programs.
        </p>
        <p>
          Where a legacy merchant relationship still exists, BearGo billed $1
          when staff confirmed a voucher in person. Views, claim attempts that
          did not produce a voucher, expired vouchers, and no-shows were $0.
        </p>
        <p>
          Outstanding vouchers and historical records remain as issued. Those
          rights are not changed by a later website copy update.
        </p>
      </div>
    </PublicShell>
  );
}

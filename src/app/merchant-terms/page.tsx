import { PublicShell } from "@/components/public/PublicShell";

export default function MerchantTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Merchant terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          You pay $1 only when your staff confirms a BearGo voucher in person.
          Views, claims, expired vouchers, and no-shows are $0.
        </p>
        <p>
          Fees accrue at $1 per redemption against your cap. Settlement is
          billed in total, not as a separate $1 card charge each time.
        </p>
        <p>
          You remain responsible for applying the discount in your own POS.
        </p>
      </div>
    </PublicShell>
  );
}

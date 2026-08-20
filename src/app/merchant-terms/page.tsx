import { PublicShell } from "@/components/public/PublicShell";

export default function MerchantTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Merchant terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          BearGo bills $1 when your staff confirms a voucher in person. Views,
          claim attempts that do not produce a voucher, expired vouchers, and
          no-shows are $0.
        </p>
        <p>
          There is no cap on claims or redemptions. You set when the offer
          ends. Players can claim until that end. A claim is complete when
          BearGo issues the voucher.
        </p>
        <p>
          You may cancel an offer at any time. Cancel stops new claims. It
          does not void vouchers already issued. Those stay valid through the
          original offer end, and your staff must honor them.
        </p>
        <p>
          Fees accrue at $1 per confirmed visit. Settlement is billed in
          total, not as a separate $1 card charge each time.
        </p>
        <p>
          You remain responsible for applying the discount in your own POS.
        </p>
      </div>
    </PublicShell>
  );
}

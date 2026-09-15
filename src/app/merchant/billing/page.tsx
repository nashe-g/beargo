import { MerchantShell, Stat } from "@/components/merchant/MerchantShell";
import { formatMoney } from "@/lib/format";
import { requireMerchant } from "@/lib/merchant-auth";
import { merchantDashboard } from "@/lib/merchant-stats";
import { BEARGO_FEE_CENTS } from "@/lib/offer";
import { dollarsFromCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function MerchantBillingPage() {
  const merchant = await requireMerchant();
  const stats = await merchantDashboard(merchant.id);

  return (
    <MerchantShell merchant={merchant} current="/merchant/billing">
      <h1 className="font-display text-4xl">Fees</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Player offers are off. Accrued fees below are from the closed $1
        program, if any. Table nights do not add fees.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Redemptions"
          value={String(stats.redeemed)}
          note={`${formatMoney(dollarsFromCents(BEARGO_FEE_CENTS))} each`}
        />
        <Stat label="Accrued BearGo fees" value={formatMoney(stats.fees)} />
      </div>
    </MerchantShell>
  );
}

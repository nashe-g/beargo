import { MerchantShell } from "@/components/merchant/MerchantShell";
import { RedeemDesk } from "@/components/merchant/RedeemDesk";
import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

export default async function MerchantRedeemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const merchant = await requireMerchant();
  const query = await searchParams;
  const code = Array.isArray(query.code) ? query.code[0] : query.code;

  return (
    <MerchantShell merchant={merchant} current="/merchant/redeem">
      <h1 className="font-display text-4xl">Redeem</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Scan the customer’s BearGo QR or type the short code. Confirm the
        purchase qualifies, then redeem. That creates a $1 BearGo fee.
      </p>
      <div className="mt-8 max-w-xl">
        <RedeemDesk initialCode={code ?? ""} />
      </div>
    </MerchantShell>
  );
}

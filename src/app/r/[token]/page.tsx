import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RedeemDesk } from "@/components/merchant/RedeemDesk";
import { MerchantShell } from "@/components/merchant/MerchantShell";
import { MERCHANT_COOKIE } from "@/lib/auth";
import { getMerchant } from "@/lib/promotions";
import { getVoucherByToken } from "@/lib/vouchers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RedeemTokenPage({
  params,
}: PageProps<"/r/[token]">) {
  const { token } = await params;
  const voucher = await getVoucherByToken(token);
  if (!voucher) notFound();
  const merchantId = (await cookies()).get(MERCHANT_COOKIE)?.value;
  const merchant = merchantId ? await getMerchant(merchantId) : null;
  if (!merchant) {
    redirect(`/merchant?next=${encodeURIComponent(`/r/${token}`)}`);
  }
  return (
    <MerchantShell merchant={merchant} current="/merchant/redeem">
      <h1 className="font-display text-4xl">Redeem</h1>
      <p className="mt-3 text-ink-soft">
        Confirm the purchase qualifies, then redeem.
      </p>
      <div className="mt-8 max-w-xl">
        <RedeemDesk initialCode={voucher.code} />
      </div>
    </MerchantShell>
  );
}

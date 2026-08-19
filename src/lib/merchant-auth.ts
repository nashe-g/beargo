import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MERCHANT_COOKIE } from "@/lib/auth";
import { getMerchant, type MerchantRecord } from "@/lib/promotions";

export { MERCHANT_COOKIE };

export async function requireMerchant(): Promise<MerchantRecord> {
  const id = (await cookies()).get(MERCHANT_COOKIE)?.value;
  const merchant = id ? await getMerchant(id) : null;
  if (!merchant) redirect("/merchant");
  return merchant;
}

export async function currentMerchantId() {
  return (await cookies()).get(MERCHANT_COOKIE)?.value ?? null;
}

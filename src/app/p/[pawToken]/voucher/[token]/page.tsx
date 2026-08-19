import { notFound } from "next/navigation";
import { VoucherTicket } from "@/components/scanner/VoucherTicket";
import { publicOrigin } from "@/lib/config";
import { getPromotion } from "@/lib/promotions";
import { getVoucherByToken } from "@/lib/vouchers";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function VoucherPage({
  params,
}: PageProps<"/p/[pawToken]/voucher/[token]">) {
  const { token } = await params;
  const voucher = await getVoucherByToken(token);
  if (!voucher) notFound();
  const promotion = await getPromotion(voucher.promotionId);
  if (!promotion) notFound();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : publicOrigin(new Request("http://local"));
  return (
    <VoucherTicket voucher={voucher} promotion={promotion} origin={origin} />
  );
}

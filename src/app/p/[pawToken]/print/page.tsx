import { headers } from "next/headers";
import { PrintSign } from "@/components/print/PrintSign";
import { CANONICAL_ORIGIN } from "@/lib/config";
import { getPaw } from "@/lib/paws";

export default async function PrintPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]/print">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const src = Array.isArray(query.src) ? query.src[0] : query.src;
  const usingLocal = src === "local";
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const localOrigin = `${protocol}://${host}`;
  const origin = usingLocal ? localOrigin : CANONICAL_ORIGIN;

  return (
    <PrintSign
      paw={getPaw(pawToken)}
      origin={origin}
      usingLocal={usingLocal}
      localHref={`/p/${pawToken}/print?src=local`}
      productionHref={`/p/${pawToken}/print`}
    />
  );
}

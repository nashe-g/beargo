import { isProduction, safeNext } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { PawMark } from "@/components/paw/PawMark";
import { DEMO_MERCHANT_ID, listMerchants } from "@/lib/promotions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MerchantLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const merchants = await listMerchants();
  const primary = merchants.find((row) => row.id === DEMO_MERCHANT_ID);
  const query = await searchParams;
  const next = safeNext(
    Array.isArray(query.next) ? query.next[0] : query.next ?? null,
    "/merchant/dashboard",
  );

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Merchant</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Pay $1 only when your staff confirms a BearGo customer actually
            showed up and redeemed.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <MagicLinkForm next={next} />
          {!isProduction() ? (
            <>
              {primary ? (
                <Link
                  href={`/merchant/enter?id=${primary.id}&next=${encodeURIComponent(next)}`}
                  className="flex h-14 items-center justify-center rounded-full bg-ink text-paper"
                >
                  Continue as {primary.displayName}
                </Link>
              ) : null}
              {merchants
                .filter((row) => row.id !== DEMO_MERCHANT_ID)
                .map((merchant) => (
                  <Link
                    key={merchant.id}
                    href={`/merchant/enter?id=${merchant.id}&next=${encodeURIComponent(next)}`}
                    className="flex h-14 items-center justify-center rounded-full border border-ink/20"
                  >
                    Continue as {merchant.displayName}
                  </Link>
                ))}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

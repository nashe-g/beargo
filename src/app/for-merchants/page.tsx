import { PublicShell } from "@/components/public/PublicShell";

export default function ForMerchantsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For merchants</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        BearGo is not accepting new local voucher merchants. The $1 per
        redemption program is not open.
      </p>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Existing records stay in place. Questions: hello@beargo.pro
      </p>
    </PublicShell>
  );
}

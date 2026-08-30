import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function ForMerchantsPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="CLOSED" title="For merchants" />
        <div className="public-prose mt-8">
          <p>
            BearGo is not accepting new local voucher merchants. The $1 per
            redemption program is not open.
          </p>
          <p>Existing records stay in place. Questions: hello@beargo.pro</p>
        </div>
      </article>
    </PublicShell>
  );
}

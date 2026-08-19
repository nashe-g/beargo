import { PublicShell } from "@/components/public/PublicShell";

export default function TermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          BearGo is a daily local challenge. Rank is entertainment, not a
          prize unless a specific promotion says otherwise.
        </p>
        <p>
          Nearby offers are optional and free to claim. You pay $0. Claiming
          asks for name, email, and phone, then a confirmation link to that
          email. A claimed voucher is not a purchase from BearGo. The promoting
          merchant applies the discount in their own checkout.
        </p>
        <p>Houston, Texas. Contact hello@beargo.pro.</p>
      </div>
    </PublicShell>
  );
}

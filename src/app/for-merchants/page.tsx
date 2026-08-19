import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicShell } from "@/components/public/PublicShell";

export default function ForMerchantsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For merchants</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Promote an offer to people already out nearby. You pay nothing when
        someone sees it or claims it. You pay $1 only when your staff confirms
        they actually showed up and redeemed.
      </p>
      <ApplyForm kind="merchant" />
    </PublicShell>
  );
}

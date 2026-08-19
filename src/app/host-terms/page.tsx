import { PublicShell } from "@/components/public/PublicShell";

export default function HostTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Host terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          You host the physical Paw and the daily game. You can block offer
          categories so BearGo does not advertise competitors in your room.
        </p>
        <p>
          Nearby merchants pay BearGo $1 per verified redemption. That fee is
          not a host payout in this version.
        </p>
      </div>
    </PublicShell>
  );
}

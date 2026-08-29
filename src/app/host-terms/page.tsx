import { PublicShell } from "@/components/public/PublicShell";

export default function HostTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Host terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          You host the physical Paw and the daily game. Players rank at your
          venue for that day.
        </p>
        <p>
          BearGo may monetize post-game traffic through affiliate or sponsored
          offers from third parties. Those offers are provided and fulfilled
          by the advertiser, not by you and not by BearGo as the seller.
        </p>
        <p>
          You are not the seller or an affiliate publisher merely because the
          QR is in your venue. There is no host revenue share unless we agree
          to one in writing.
        </p>
        <p>
          BearGo controls the post-game monetization unit. Viewing or clicking
          an affiliate offer does not change a player’s rank.
        </p>
      </div>
    </PublicShell>
  );
}

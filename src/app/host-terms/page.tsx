import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function HostTermsPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="POLICY" title="Host terms" />
        <div className="public-prose mt-8">
          <p>
            You host the physical Paw. Players talk in your room and rank at
            your venue for that night.
          </p>
          <p>
            BearGo may monetize post-game traffic through affiliate or
            sponsored offers from third parties. Those offers are provided and
            fulfilled by the advertiser, not by you and not by BearGo as the
            seller.
          </p>
          <p>
            You are not the seller or an affiliate publisher merely because
            the QR is in your venue. There is no host revenue share unless we
            agree to one in writing.
          </p>
          <p>
            BearGo controls the post-game monetization unit. Viewing or
            clicking an affiliate offer does not change a player’s rank.
          </p>
        </div>
      </article>
    </PublicShell>
  );
}

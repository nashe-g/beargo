import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="POLICY" title="Terms" />
        <div className="public-prose mt-8">
          <p>
            BearGo is a venue night: a room and two games. Rank is
            entertainment. It is separate from any sponsored or affiliate offer.
          </p>
          <p>
            After gameplay, BearGo may show an optional affiliate or sponsored
            offer from a third party. Viewing or clicking it does not change
            your score or rank. You do not have to click.
          </p>
          <p>
            BearGo may receive a commission if you later complete a qualifying
            purchase with that third party. BearGo is not the seller of those
            products or services. Price, inventory, eligibility, fulfillment,
            refunds, and availability are controlled by the advertiser. Their
            site has its own terms and privacy policy.
          </p>
          <p>
            Affiliate offers can change or disappear at any time. BearGo does
            not guarantee any savings, stock, or advertiser program.
          </p>
          <p>Houston, Texas. Contact hello@beargo.pro.</p>
        </div>
      </article>
    </PublicShell>
  );
}

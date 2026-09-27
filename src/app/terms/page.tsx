import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="POLICY" title="Terms" />
        <div className="public-prose mt-8">
          <p>
            BearGo is a venue night: two games, and a live chat if people want
            to talk. Rank is entertainment.
          </p>
          <p>
            We do not currently show sponsored or affiliate offers. If we add
            them later, they will be optional and will not change your score or
            rank.
          </p>
          <p>Houston, Texas. Contact hello@beargo.pro.</p>
        </div>
      </article>
    </PublicShell>
  );
}

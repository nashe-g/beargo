import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="POLICY" title="Privacy" />
        <div className="public-prose mt-8">
          <p>
            Playing at a venue does not require an account or personal
            details. Rank is local to the bar and the night.
          </p>
          <p>
            BearGo records that someone scanned or played at a venue: the paw
            token, host, challenge, score, and timing needed to rank that
            night. We use this to run the games, the chat, and the boards. We do
            not ask for your name, email, or phone to play.
          </p>
          <p>
            We do not currently show sponsored or affiliate offers. If we add
            them later, we may record that a card was shown and whether it was
            clicked, including the offer, advertiser, venue, and time. We would
            not put your name, email, phone, or trivia answers into those
            records.
          </p>
          <p>
            We keep gameplay records for operations, fraud, and reporting.
            Hosts see game counts, not player contact details. We do not sell
            player contact as a lead.
          </p>
          <p>Questions: hello@beargo.pro</p>
        </div>
      </article>
    </PublicShell>
  );
}

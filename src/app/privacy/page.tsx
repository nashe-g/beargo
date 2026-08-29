import { PublicShell } from "@/components/public/PublicShell";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          Playing the daily challenge does not require an account or personal
          details. Rank is local to the venue and the day.
        </p>
        <p>
          BearGo records that a game was played at a venue: the paw token, host,
          challenge, score, and timing needed to rank that day. We use this to
          run the board and understand how the game is used. We do not ask for
          your name, email, or phone to play.
        </p>
        <p>
          After you see your result, BearGo may show an optional sponsored or
          affiliate offer from a third party. If that card appears, we may
          record that it was shown and whether it was clicked, including the
          offer, advertiser, venue, and time. We do not put your name, email,
          phone, or trivia answers into those records or into affiliate
          tracking parameters.
        </p>
        <p>
          Clicking an affiliate link leaves BearGo and sends you to a third
          party such as an advertiser site. CJ Affiliate and/or the advertiser
          may use cookies or other identifiers on their sites to attribute a
          qualifying purchase. Those sites operate under their own privacy
          practices.
        </p>
        <p>
          BearGo’s affiliate measurement uses a normal tracked link after your
          click. We do not install a global third-party affiliate tag on every
          page. You can control cookies in your browser settings.
        </p>
        <p>
          We keep gameplay and affiliate measurement records for operations,
          fraud, and reporting. Hosts see game counts, not player contact
          details. We do not sell player contact as a lead.
        </p>
        <p>Questions: hello@beargo.pro</p>
      </div>
    </PublicShell>
  );
}

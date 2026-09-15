import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function HostTermsPage() {
  return (
    <PublicShell>
      <article className="max-w-2xl">
        <PublicHeading kicker="POLICY" title="Host terms" />
        <div className="public-prose mt-8">
          <p>
            You host the physical Paw. Players sit a table, play tonight’s
            games, then talk in your room as that table.
          </p>
          <p>
            We do not currently run sponsored offers in your room. If we add
            third-party offers later, they will be from the advertiser, not
            from you. You are not an affiliate publisher merely because the QR
            is in your venue. There is no host revenue share unless we agree to
            one in writing.
          </p>
        </div>
      </article>
    </PublicShell>
  );
}

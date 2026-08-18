import { PublicShell } from "@/components/public/PublicShell";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">How it works</h1>
      <ol className="mt-8 space-y-6 text-lg">
        <li>
          <strong>Scan the paw.</strong> A printed mark at the venue. No app
          install.
        </li>
        <li>
          <strong>Three questions.</strong> Same set for everyone here today.
          Correct answers and speed set your rank.
        </li>
        <li>
          <strong>See how you rank.</strong> That’s the game. Optional
          introductions only after that.
        </li>
      </ol>
      <p className="mt-8 text-ink-soft">
        If a sponsor is on the floor, you can choose to connect. You pay
        nothing. The venue may earn from a qualified introduction.
      </p>
    </PublicShell>
  );
}

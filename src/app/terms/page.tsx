import { PublicShell } from "@/components/public/PublicShell";

export default function TermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          BearGo is a daily local challenge. Rank is entertainment, not a
          prize unless a specific promotion says otherwise.
        </p>
        <p>
          Optional introductions are not a purchase. You pay $0. By finishing
          an introduction you ask us to share the details you provided with
          that sponsor.
        </p>
        <p>Houston, Texas. Contact hello@beargo.pro.</p>
      </div>
    </PublicShell>
  );
}

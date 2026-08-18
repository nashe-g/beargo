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
          If you choose an optional introduction, we collect name, email, phone,
          and your answers to qualification questions so we can verify contact
          and share them with that day’s sponsor after you consent.
        </p>
        <p>
          Hosts see game counts and potential earnings, not your contact
          details. Startups see contact only after a qualified introduction.
          Admin may access in-progress details for support and fraud.
        </p>
        <p>Questions: hello@beargo.pro</p>
      </div>
    </PublicShell>
  );
}

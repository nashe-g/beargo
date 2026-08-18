import { PublicShell } from "@/components/public/PublicShell";

export default function StartupTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Startup terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          You pay only for qualified introductions: verified contact, completed
          qualification, and consent. Games, views, and exits are not billed.
        </p>
        <p>
          Campaigns pause when funded balance cannot cover the next qualified
          lead. You may not use the challenge to promote the sponsor as trivia.
        </p>
      </div>
    </PublicShell>
  );
}

import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicShell } from "@/components/public/PublicShell";

export default function ForStartupsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For startups</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Your card shows after a completed game. You only pay for people who
        choose to connect and finish. No SDK. No webhook.
      </p>
      <ApplyForm kind="startup" />
    </PublicShell>
  );
}

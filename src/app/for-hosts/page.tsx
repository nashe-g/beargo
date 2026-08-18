import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicShell } from "@/components/public/PublicShell";

export default function ForHostsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For hosts</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Put a Paw where people already pause. The game runs either way. If a
        sponsor is live, a qualified introduction can earn the house — you
        never collect from the player.
      </p>
      <ApplyForm kind="host" />
    </PublicShell>
  );
}

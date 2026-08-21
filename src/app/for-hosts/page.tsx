import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicShell } from "@/components/public/PublicShell";

export default function ForHostsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For hosts</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Put a Paw where people already pause. The game is the product. You
        control which nearby offer categories can appear after the game — never a
        competitor against this room.
      </p>
      <ApplyForm kind="host" />
    </PublicShell>
  );
}

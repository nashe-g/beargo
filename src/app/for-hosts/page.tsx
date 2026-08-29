import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicShell } from "@/components/public/PublicShell";

export default function ForHostsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">For hosts</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Put a Paw where people already pause. The game is the product.
      </p>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        BearGo may display optional affiliate or sponsored offers after
        gameplay. These offers are separate from the trivia experience and do
        not affect a player’s result. Hosts are not advertisers or
        sub-affiliates just because the QR is in the room.
      </p>
      <ApplyForm kind="host" />
    </PublicShell>
  );
}

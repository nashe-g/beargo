import { ApplyForm } from "@/components/public/ApplyForm";
import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

export default function ForHostsPage() {
  return (
    <PublicShell>
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          <PublicHeading kicker="VENUES" title="For hosts" />
          <div className="public-prose mt-6 max-w-xl">
            <p>Put a Paw where people already pause. The game is the product.</p>
            <p>
              BearGo may display optional affiliate or sponsored offers after
              gameplay. These offers are separate from the trivia experience
              and do not affect a player’s result. Hosts are not advertisers or
              sub-affiliates just because the QR is in the room.
            </p>
          </div>
        </div>
        <div className="rounded-[1.8rem] border border-ink/10 bg-pad/70 p-6 shadow-[0_16px_36px_rgba(26,18,11,0.05)] sm:p-7">
          <p className="font-display text-2xl">Apply</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Tell us the room. We’ll review and email a sign-in link if we take
            you live.
          </p>
          <ApplyForm kind="host" />
        </div>
      </div>
    </PublicShell>
  );
}

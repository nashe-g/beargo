import { PublicShell } from "@/components/public/PublicShell";

export default function HostTermsPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-5xl">Host terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          You host a physical Paw. The game must remain playable without a
          sponsor. Print stays sponsor-free.
        </p>
        <p>
          Amounts shown in the host console are potential until a payout is
          marked paid. Live economics begin when billing is turned on.
        </p>
      </div>
    </PublicShell>
  );
}

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
          Claiming a nearby offer asks for name, email, and phone. We email a
          link so you can confirm the address is yours before the voucher is
          issued. We keep that contact for BearGo. We do not sell it as a lead
          to the promoting merchant.
        </p>
        <p>
          Hosts see game counts, not player contact details. Merchants see
          voucher redemptions for their offers. Admin may access operational
          records for support and fraud.
        </p>
        <p>Questions: hello@beargo.pro</p>
      </div>
    </PublicShell>
  );
}

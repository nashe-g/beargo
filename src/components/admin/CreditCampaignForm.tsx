"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreditCampaignForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("100");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/admin/campaigns/${campaignId}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    if (!response.ok) {
      setError("Could not credit.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-wrap gap-2">
      <input
        type="number"
        min="1"
        step="1"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="h-12 w-28 rounded-full border border-ink/15 px-4"
      />
      <button type="submit" className="h-12 rounded-full bg-ink px-5 text-paper">
        Credit dollars
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

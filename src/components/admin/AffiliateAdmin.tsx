"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateAdvertiser, AffiliateOffer } from "@/lib/affiliate";

const fieldClass =
  "h-12 w-full rounded-full border border-ink/15 px-4 outline-none focus:border-honey";

export function AffiliateAdmin({
  advertisers,
  offers,
  counts,
}: {
  advertisers: AffiliateAdvertiser[];
  offers: AffiliateOffer[];
  counts: Record<string, { impressions: number; clicks: number }>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createAdvertiser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/affiliate/advertisers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        networkAdvertiserId: form.get("networkAdvertiserId"),
        relationshipStatus: form.get("relationshipStatus"),
        active: form.get("active") === "on",
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not save advertiser.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function createOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/affiliate/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        advertiserId: form.get("advertiserId"),
        title: form.get("title"),
        body: form.get("body"),
        ctaLabel: form.get("ctaLabel"),
        affiliateClickUrl: form.get("affiliateClickUrl"),
        advertiserDestination: form.get("advertiserDestination"),
        imageUrl: form.get("imageUrl"),
        sourceLinkId: form.get("sourceLinkId"),
        startsAt: form.get("startsAt") || undefined,
        endsAt: form.get("endsAt") || undefined,
        adminWeight: Number(form.get("adminWeight") ?? 1),
        complianceReviewed: form.get("complianceReviewed") === "on",
        active: form.get("active") === "on",
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not save offer.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/affiliate/offers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-clay">{error}</p> : null}

      <form
        onSubmit={createAdvertiser}
        className="space-y-3 rounded-[2rem] border border-ink/10 px-5 py-5"
      >
        <h2 className="font-display text-2xl">Add advertiser</h2>
        <p className="text-sm text-ink-soft">
          Only mark relationship as joined after CJ shows the program as
          joined. Pending advertisers never serve.
        </p>
        <input name="name" required placeholder="Advertiser name" className={fieldClass} />
        <input
          name="networkAdvertiserId"
          placeholder="CJ advertiser CID (optional)"
          className={fieldClass}
        />
        <select name="relationshipStatus" className={fieldClass} defaultValue="pending">
          <option value="pending">Pending</option>
          <option value="joined">Joined</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" /> Active
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-ink px-6 text-paper disabled:opacity-40"
        >
          Save advertiser
        </button>
      </form>

      <form
        onSubmit={createOffer}
        className="space-y-3 rounded-[2rem] border border-ink/10 px-5 py-5"
      >
        <h2 className="font-display text-2xl">Add offer</h2>
        <p className="text-sm text-ink-soft">
          Paste an approved CJ tracking URL. Do not invent prices or savings.
          Compliance reviewed + active + joined advertiser are required to
          show after rank.
        </p>
        <select name="advertiserId" required className={fieldClass} defaultValue="">
          <option value="" disabled>
            Advertiser
          </option>
          {advertisers.map((advertiser) => (
            <option key={advertiser.id} value={advertiser.id}>
              {advertiser.name} · {advertiser.relationshipStatus}
            </option>
          ))}
        </select>
        <input name="title" required placeholder="Headline" className={fieldClass} />
        <textarea
          name="body"
          required
          placeholder="Short factual description"
          className="min-h-24 w-full rounded-2xl border border-ink/15 px-4 py-3"
        />
        <input
          name="ctaLabel"
          required
          placeholder="Explore deals on Groupon"
          className={fieldClass}
        />
        <input
          name="affiliateClickUrl"
          required
          type="url"
          placeholder="https://www.anrdoezrs.net/…"
          className={fieldClass}
        />
        <input
          name="advertiserDestination"
          placeholder="Advertiser destination (audit, optional)"
          className={fieldClass}
        />
        <input
          name="imageUrl"
          type="url"
          placeholder="Approved creative URL (optional)"
          className={fieldClass}
        />
        <input name="sourceLinkId" placeholder="CJ link ID (optional)" className={fieldClass} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="startsAt" type="datetime-local" className={fieldClass} />
          <input name="endsAt" type="datetime-local" className={fieldClass} />
          <input
            name="adminWeight"
            type="number"
            min={1}
            defaultValue={1}
            className={fieldClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="complianceReviewed" /> Compliance reviewed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" /> Active
        </label>
        <button
          type="submit"
          disabled={busy || advertisers.length === 0}
          className="h-12 rounded-full bg-ink px-6 text-paper disabled:opacity-40"
        >
          Save offer
        </button>
      </form>

      <div>
        <h2 className="font-display text-2xl">Live board</h2>
        {offers.length === 0 ? (
          <p className="mt-3 text-ink-soft">No offers yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {offers.map((offer) => {
              const advertiser = advertisers.find(
                (row) => row.id === offer.advertiserId,
              );
              const stats = counts[offer.id] ?? { impressions: 0, clicks: 0 };
              return (
                <li
                  key={offer.id}
                  className="rounded-3xl border border-ink/10 px-5 py-5"
                >
                  <p className="text-sm text-ink-soft">
                    {advertiser?.name ?? offer.advertiserId} ·{" "}
                    {advertiser?.relationshipStatus} ·{" "}
                    {offer.active ? "active" : "off"} ·{" "}
                    {offer.complianceReviewed ? "reviewed" : "needs review"}
                  </p>
                  <h3 className="mt-2 font-display text-2xl">{offer.title}</h3>
                  <p className="mt-1 text-ink-soft">{offer.body}</p>
                  <p className="mt-2 text-sm">{offer.ctaLabel}</p>
                  <p className="mt-3 text-sm text-ink-soft">
                    {stats.impressions} impressions · {stats.clicks} clicks
                    {stats.impressions
                      ? ` · ${((stats.clicks / stats.impressions) * 100).toFixed(1)}% CTR`
                      : ""}
                  </p>
                  <div className="mt-4 rounded-2xl border border-ink/10 px-4 py-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
                      Preview
                    </p>
                    <p className="mt-2 font-display text-xl">{offer.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{offer.body}</p>
                    <p className="mt-3 text-sm font-semibold">{offer.ctaLabel}</p>
                    <p className="mt-2 text-xs text-ink-soft">
                      We may earn a commission if you make a purchase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(offer.id, !offer.active)}
                    className="mt-4 h-11 rounded-full border border-ink/20 px-5"
                  >
                    {offer.active ? "Disable now" : "Enable"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

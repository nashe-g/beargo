"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressFields } from "@/components/admin/AddressFields";
import { PROMOTION_CATEGORIES } from "@/lib/offer";

const fieldClass =
  "h-12 w-full rounded-full border border-ink/15 px-4 outline-none focus:border-honey";

export function CreateOfferForm() {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("entertainment");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Houston");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [amount, setAmount] = useState("10");
  const [percent, setPercent] = useState("20");
  const [minimum, setMinimum] = useState("30");
  const [maxOff, setMaxOff] = useState("5");
  const [radiusMiles, setRadiusMiles] = useState("1.5");
  const [teaserMode, setTeaserMode] = useState("merchant_hidden");
  const [shortTerms, setShortTerms] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantName,
        email,
        category,
        address,
        city,
        neighborhood,
        lat: Number(lat),
        lng: Number(lng),
        discountType,
        discountAmount: Number(amount),
        discountPercent: Number(percent),
        minimumPurchase: Number(minimum),
        maxDiscount: Number(maxOff),
        radiusMiles: Number(radiusMiles),
        teaserMode,
        shortTerms,
        testMode,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not create offer.");
      return;
    }
    setMerchantName("");
    setEmail("");
    setAddress("");
    setNeighborhood("");
    setLat("");
    setLng("");
    setShortTerms("");
    setError("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[2rem] border border-ink/10 px-5 py-5"
    >
      <h2 className="font-display text-2xl">Add a merchant offer</h2>
      <p className="text-sm text-ink-soft">
        This is the business players visit. Enter its address so BearGo can
        place it near host venues.
      </p>
      <input
        required
        value={merchantName}
        onChange={(event) => setMerchantName(event.target.value)}
        placeholder="Business name"
        className={fieldClass}
      />
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Merchant login email"
        className={fieldClass}
      />
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className={fieldClass}
      >
        {PROMOTION_CATEGORIES.map((row) => (
          <option key={row.id} value={row.id}>
            {row.label}
          </option>
        ))}
      </select>
      <AddressFields
        address={address}
        city={city}
        neighborhood={neighborhood}
        lat={lat}
        lng={lng}
        onChange={(patch) => {
          if (patch.address != null) setAddress(patch.address);
          if (patch.city != null) setCity(patch.city);
          if (patch.neighborhood != null) setNeighborhood(patch.neighborhood);
          if (patch.lat != null) setLat(patch.lat);
          if (patch.lng != null) setLng(patch.lng);
        }}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={discountType}
          onChange={(event) =>
            setDiscountType(event.target.value as "fixed" | "percentage")
          }
          className={fieldClass}
        >
          <option value="fixed">$ off</option>
          <option value="percentage">% off</option>
        </select>
        {discountType === "fixed" ? (
          <input
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Dollars off"
            inputMode="decimal"
            className={fieldClass}
          />
        ) : (
          <input
            required
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            placeholder="Percent off"
            inputMode="numeric"
            className={fieldClass}
          />
        )}
        <input
          required
          value={minimum}
          onChange={(event) => setMinimum(event.target.value)}
          placeholder="Minimum purchase $"
          inputMode="decimal"
          className={fieldClass}
        />
        {discountType === "percentage" ? (
          <input
            value={maxOff}
            onChange={(event) => setMaxOff(event.target.value)}
            placeholder="Max $ off"
            inputMode="decimal"
            className={fieldClass}
          />
        ) : (
          <input
            value={radiusMiles}
            onChange={(event) => setRadiusMiles(event.target.value)}
            placeholder="Radius miles"
            inputMode="decimal"
            className={fieldClass}
          />
        )}
      </div>
      {discountType === "percentage" ? (
        <input
          value={radiusMiles}
          onChange={(event) => setRadiusMiles(event.target.value)}
          placeholder="Radius miles"
          inputMode="decimal"
          className={fieldClass}
        />
      ) : null}
      <select
        value={teaserMode}
        onChange={(event) => setTeaserMode(event.target.value)}
        className={fieldClass}
      >
        <option value="merchant_hidden">Hide merchant until they tap</option>
        <option value="merchant_visible">Show merchant in the teaser</option>
      </select>
      <input
        value={shortTerms}
        onChange={(event) => setShortTerms(event.target.value)}
        placeholder="Short terms (optional)"
        className={fieldClass}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={testMode}
          onChange={(event) => setTestMode(event.target.checked)}
        />
        Test offer — do not bill $1
      </label>
      <button type="submit" className="h-12 rounded-full bg-ink px-5 text-paper">
        Add live offer
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

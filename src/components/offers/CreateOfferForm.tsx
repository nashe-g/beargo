"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AddressFields } from "@/components/admin/AddressFields";
import { OTHER_CATEGORY, PROMOTION_CATEGORIES } from "@/lib/offer";

const fieldClass =
  "h-12 w-full rounded-full border border-ink/15 px-4 outline-none focus:border-honey";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="px-1 text-sm text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function categoryDefaults(category?: string) {
  if (!category) return { category: "entertainment", categoryOther: "" };
  const known = PROMOTION_CATEGORIES.some((row) => row.id === category);
  if (known) return { category, categoryOther: "" };
  return { category: OTHER_CATEGORY, categoryOther: category };
}

export function CreateOfferForm({
  role = "admin",
  defaultLocation,
  defaultCategory,
}: {
  role?: "admin" | "merchant";
  defaultLocation?: {
    address: string;
    city: string;
    neighborhood?: string | null;
    lat: number;
    lng: number;
  };
  defaultCategory?: string;
}) {
  const router = useRouter();
  const starting = categoryDefaults(defaultCategory);
  const [merchantName, setMerchantName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(starting.category);
  const [categoryOther, setCategoryOther] = useState(starting.categoryOther);
  const [address, setAddress] = useState(defaultLocation?.address ?? "");
  const [city, setCity] = useState(defaultLocation?.city ?? "Houston");
  const [neighborhood, setNeighborhood] = useState(
    defaultLocation?.neighborhood ?? "",
  );
  const [lat, setLat] = useState(
    defaultLocation ? String(defaultLocation.lat) : "",
  );
  const [lng, setLng] = useState(
    defaultLocation ? String(defaultLocation.lng) : "",
  );
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [amount, setAmount] = useState("10");
  const [percent, setPercent] = useState("20");
  const [minimum, setMinimum] = useState("30");
  const [maxOff, setMaxOff] = useState("5");
  const [radiusMiles, setRadiusMiles] = useState("1.5");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [teaserMode, setTeaserMode] = useState("merchant_hidden");
  const [shortTerms, setShortTerms] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const path =
      role === "merchant"
        ? "/api/merchant/promotions"
        : "/api/admin/promotions";
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(role === "admin" ? { merchantName, email, testMode } : {}),
        category,
        categoryOther,
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
        endDate,
        endTime,
        teaserMode,
        shortTerms,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not create offer.");
      return;
    }
    if (role === "admin") {
      setMerchantName("");
      setEmail("");
      setCategory("entertainment");
      setCategoryOther("");
      setAddress("");
      setNeighborhood("");
      setLat("");
      setLng("");
      setTestMode(false);
    }
    setEndDate("");
    setEndTime("");
    setShortTerms("");
    setError("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[2rem] border border-ink/10 px-5 py-5"
    >
      <h2 className="font-display text-2xl">
        {role === "merchant" ? "Add an offer" : "Add a merchant offer"}
      </h2>
      <p className="text-sm text-ink-soft">
        {role === "merchant"
          ? "Where customers redeem. BearGo uses this address to place the offer near host venues."
          : "This is the business players visit. Enter its address so BearGo can place it near host venues."}
      </p>
      {role === "admin" ? (
        <>
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
        </>
      ) : null}
      <Field label="Category">
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
          <option value={OTHER_CATEGORY}>Other</option>
        </select>
      </Field>
      {category === OTHER_CATEGORY ? (
        <Field label="What category is this?">
          <input
            required
            value={categoryOther}
            onChange={(event) => setCategoryOther(event.target.value)}
            placeholder="e.g. Bookstore"
            className={fieldClass}
          />
        </Field>
      ) : null}
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Discount">
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
        </Field>
        {discountType === "fixed" ? (
          <Field label="Amount off ($)">
            <input
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
        ) : (
          <Field label="Percent off">
            <input
              required
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              inputMode="numeric"
              className={fieldClass}
            />
          </Field>
        )}
        <Field label="Minimum purchase ($)">
          <input
            required
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
        {discountType === "percentage" ? (
          <Field label="Max $ off">
            <input
              value={maxOff}
              onChange={(event) => setMaxOff(event.target.value)}
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
        ) : null}
        <Field label="Radius from host (miles)">
          <input
            required
            value={radiusMiles}
            onChange={(event) => setRadiusMiles(event.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Offer end date">
          <input
            required
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Offer end time">
          <input
            required
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <p className="px-1 text-sm text-ink-soft">
        Date and time are in the business’s local timezone. Players can claim
        until this moment. Issued vouchers stay valid through this same end,
        even if the offer is later canceled.
      </p>
      <Field label="Teaser">
        <select
          value={teaserMode}
          onChange={(event) => setTeaserMode(event.target.value)}
          className={fieldClass}
        >
          <option value="merchant_hidden">Hide merchant until they tap</option>
          <option value="merchant_visible">Show merchant in the teaser</option>
        </select>
      </Field>
      <input
        value={shortTerms}
        onChange={(event) => setShortTerms(event.target.value)}
        placeholder="Short terms (optional)"
        className={fieldClass}
      />
      {role === "admin" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(event) => setTestMode(event.target.checked)}
          />
          Test offer — do not bill $1
        </label>
      ) : null}
      <button type="submit" className="h-12 rounded-full bg-ink px-5 text-paper">
        Add live offer
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

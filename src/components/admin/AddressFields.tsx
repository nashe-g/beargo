"use client";

import { useState } from "react";

const fieldClass =
  "h-12 w-full rounded-full border border-ink/15 px-4 outline-none focus:border-honey";

export function AddressFields({
  address,
  city,
  neighborhood,
  lat,
  lng,
  onChange,
}: {
  address: string;
  city: string;
  neighborhood: string;
  lat: string;
  lng: string;
  onChange: (patch: {
    address?: string;
    city?: string;
    neighborhood?: string;
    lat?: string;
    lng?: string;
  }) => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city }),
      });
      const payload = (await response.json()) as {
        lat?: number;
        lng?: number;
        error?: string;
      };
      if (!response.ok || payload.lat == null || payload.lng == null) {
        setMessage(payload.error ?? "Could not find that address.");
        setBusy(false);
        return;
      }
      onChange({
        lat: payload.lat.toFixed(6),
        lng: payload.lng.toFixed(6),
      });
      setMessage("Coordinates filled from the address.");
    } catch {
      setMessage("Could not look up that address.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <input
        required
        value={address}
        onChange={(event) => onChange({ address: event.target.value })}
        placeholder="Street address"
        className={fieldClass}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={city}
          onChange={(event) => onChange({ city: event.target.value })}
          placeholder="City"
          className={fieldClass}
        />
        <input
          value={neighborhood}
          onChange={(event) => onChange({ neighborhood: event.target.value })}
          placeholder="Neighborhood (optional)"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          required
          value={lat}
          onChange={(event) => onChange({ lat: event.target.value })}
          placeholder="Latitude"
          inputMode="decimal"
          className={`${fieldClass} sm:max-w-[10rem]`}
        />
        <input
          required
          value={lng}
          onChange={(event) => onChange({ lng: event.target.value })}
          placeholder="Longitude"
          inputMode="decimal"
          className={`${fieldClass} sm:max-w-[10rem]`}
        />
        <button
          type="button"
          onClick={lookup}
          disabled={busy || !address.trim()}
          className="h-12 rounded-full border border-ink/20 px-5 disabled:opacity-40"
        >
          {busy ? "Looking up" : "Look up address"}
        </button>
      </div>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
    </div>
  );
}

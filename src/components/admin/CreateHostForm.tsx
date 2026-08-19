"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressFields } from "@/components/admin/AddressFields";

const fieldClass =
  "h-12 w-full rounded-full border border-ink/15 px-4 outline-none focus:border-honey";

export function CreateHostForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Houston");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        email,
        address,
        city,
        neighborhood,
        lat: Number(lat),
        lng: Number(lng),
        timezone: "America/Chicago",
      }),
    });
    if (!response.ok) {
      setError("Could not create host.");
      return;
    }
    setDisplayName("");
    setEmail("");
    setAddress("");
    setNeighborhood("");
    setLat("");
    setLng("");
    setError("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[2rem] border border-ink/10 px-5 py-5"
    >
      <h2 className="font-display text-2xl">Add a host venue</h2>
      <p className="text-sm text-ink-soft">
        Address is required. Nearby offers route from these coordinates, not
        phone GPS.
      </p>
      <input
        required
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Venue name"
        className={fieldClass}
      />
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Host login email"
        className={fieldClass}
      />
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
      <button type="submit" className="h-12 rounded-full bg-ink px-5 text-paper">
        Add host
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </form>
  );
}

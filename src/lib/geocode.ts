export type GeocodeHit = {
  lat: number;
  lng: number;
  label: string;
};

export async function geocodeAddress(query: string): Promise<GeocodeHit | null> {
  const trimmed = query.trim();
  if (trimmed.length < 5) return null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "0");
  const response = await fetch(url, {
    headers: {
      "User-Agent": "BearGo/1.0 (hello@beargo.pro)",
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as {
    lat?: string;
    lon?: string;
    display_name?: string;
  }[];
  const hit = rows[0];
  if (!hit?.lat || !hit.lon) return null;
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name ?? trimmed,
  };
}

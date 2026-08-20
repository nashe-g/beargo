import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";
import { geocodeAddress } from "@/lib/geocode";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const jar = await cookies();
  const admin = jar.get(ADMIN_COOKIE)?.value === "1";
  const merchant = Boolean(jar.get(MERCHANT_COOKIE)?.value);
  if (!admin && !merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit(clientKey(request, "geocode"), 20, 60_000)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const body = (await request.json()) as { address?: string; city?: string };
  const address = String(body.address ?? "").trim();
  const city = String(body.city ?? "Houston").trim();
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }
  const query = /houston/i.test(`${address} ${city}`)
    ? `${address}, ${city}`
    : `${address}, ${city}, Texas`;
  const hit = await geocodeAddress(query);
  if (!hit) {
    return NextResponse.json(
      { error: "Could not find that address." },
      { status: 404 },
    );
  }
  return NextResponse.json(hit);
}

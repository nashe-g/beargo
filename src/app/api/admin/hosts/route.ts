import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { upsertUser } from "@/lib/auth";
import { upsertHost } from "@/lib/catalog";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    displayName?: string;
    timezone?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    lat?: number;
    lng?: number;
    email?: string;
  };
  const displayName = String(body.displayName ?? "").trim();
  const address = String(body.address ?? "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!displayName) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Address and coordinates required" },
      { status: 400 },
    );
  }
  const host = await upsertHost({
    displayName,
    timezone: String(body.timezone ?? "America/Chicago"),
    city: String(body.city ?? "Houston"),
    neighborhood: body.neighborhood || null,
    address,
    lat,
    lng,
  });
  const email = String(body.email ?? "").trim();
  if (email.includes("@")) {
    await upsertUser({ email, role: "host", hostId: host.id });
  }
  await audit("admin", "hosts.create", { id: host.id });
  return NextResponse.json({ host });
}

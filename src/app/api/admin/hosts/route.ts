import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
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
  };
  const displayName = String(body.displayName ?? "").trim();
  if (!displayName) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const host = await upsertHost({
    displayName,
    timezone: String(body.timezone ?? "America/Chicago"),
    city: String(body.city ?? "Houston"),
    neighborhood: body.neighborhood ?? null,
  });
  await audit("admin", "hosts.create", { id: host.id });
  return NextResponse.json({ host });
}

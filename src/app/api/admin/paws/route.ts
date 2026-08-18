import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { upsertPaw } from "@/lib/catalog";
import { slugify } from "@/lib/slug";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    token?: string;
    hostId?: string;
    placementLabel?: string;
  };
  const token = slugify(String(body.token ?? ""));
  const hostId = String(body.hostId ?? "");
  const placementLabel = String(body.placementLabel ?? "").trim();
  if (!token || !hostId || !placementLabel) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const paw = await upsertPaw({ token, hostId, placementLabel });
  await audit("admin", "paws.create", { token });
  return NextResponse.json({ paw });
}

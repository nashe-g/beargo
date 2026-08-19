import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { createPaw } from "@/lib/catalog";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    hostId?: string;
    placementLabel?: string;
  };
  const hostId = String(body.hostId ?? "");
  const placementLabel = String(body.placementLabel ?? "").trim();
  if (!hostId || !placementLabel) {
    return NextResponse.json({ error: "Host and placement required" }, { status: 400 });
  }
  const paw = await createPaw({ hostId, placementLabel });
  if (!paw) {
    return NextResponse.json({ error: "Could not create a unique Paw." }, { status: 409 });
  }
  await audit("admin", "paws.create", { token: paw.token });
  return NextResponse.json({ paw });
}

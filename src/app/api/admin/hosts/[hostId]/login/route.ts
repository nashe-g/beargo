import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { attachHostLogin } from "@/lib/auth";
import { getHost } from "@/lib/catalog";

export async function POST(
  request: Request,
  context: { params: Promise<{ hostId: string }> },
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { hostId } = await context.params;
  const host = await getHost(hostId);
  if (!host) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as { email?: string };
  const login = await attachHostLogin(host.id, String(body.email ?? ""));
  if (!login.ok) {
    return NextResponse.json({ error: login.error }, { status: 409 });
  }
  await audit("admin", "hosts.login", { id: host.id });
  return NextResponse.json({ ok: true });
}

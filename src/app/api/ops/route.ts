import { NextResponse } from "next/server";
import {
  OPS_COOKIE,
  opsCookieValue,
  opsGateEnabled,
  opsPassword,
} from "@/lib/ops-gate";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = String((body as { password?: unknown }).password ?? "");
  const expected = opsPassword();
  if (opsGateEnabled() && !expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_COOKIE, await opsCookieValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: opsGateEnabled(),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}

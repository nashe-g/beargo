import { NextResponse } from "next/server";
import { magicLinkOrigin, requestMagicLink } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "magic"), 8, 60_000)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  let body: { email?: string; next?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter an email." }, { status: 400 });
  }
  const next = body.next?.startsWith("/") ? body.next : "/";
  const result = await requestMagicLink({
    email,
    origin: magicLinkOrigin(request),
    next,
  });
  return NextResponse.json({
    sent: result.sent,
    mode: "mode" in result ? result.mode : undefined,
  });
}

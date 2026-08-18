import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OPS_COOKIE,
  isOpsPath,
  opsCookieValue,
  opsGateEnabled,
  opsPassword,
} from "@/lib/ops-gate";

export async function proxy(request: NextRequest) {
  if (!opsGateEnabled() || !isOpsPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const password = opsPassword();
  if (!password) {
    return new NextResponse("Not found", { status: 404 });
  }

  const expected = await opsCookieValue(password);
  const cookie = request.cookies.get(OPS_COOKIE)?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const next = request.nextUrl.pathname + request.nextUrl.search;
  const url = request.nextUrl.clone();
  url.pathname = "/ops";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/host/:path*",
    "/host",
    "/startup/:path*",
    "/startup",
    "/admin/:path*",
    "/admin",
    "/lab/:path*",
    "/lab",
    "/api/admin/:path*",
  ],
};

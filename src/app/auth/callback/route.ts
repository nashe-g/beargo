import { NextResponse } from "next/server";
import { applyAuthCookies, consumeMagicLink, safeNext } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const next = safeNext(url.searchParams.get("next"), "/");
  const user = token ? await consumeMagicLink(token) : null;
  if (!user) {
    return NextResponse.redirect(new URL("/auth/expired", url.origin));
  }
  const destination =
    next !== "/"
      ? next
      : user.role === "admin"
        ? "/admin/overview"
        : user.role === "host"
          ? "/host/dashboard"
          : "/merchant/dashboard";
  const response = NextResponse.redirect(new URL(destination, url.origin));
  applyAuthCookies(response, user);
  return response;
}

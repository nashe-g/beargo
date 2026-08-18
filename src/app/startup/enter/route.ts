import { NextResponse } from "next/server";
import { isProduction } from "@/lib/auth";
import { STARTUP_COOKIE } from "@/lib/startup-auth";
import { getStartup } from "@/lib/startups";

export async function GET(request: Request) {
  if (isProduction()) {
    return NextResponse.redirect(new URL("/startup", request.url));
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!(await getStartup(id))) {
    return NextResponse.redirect(new URL("/startup", url.origin));
  }

  const response = NextResponse.redirect(
    new URL("/startup/dashboard", url.origin),
  );
  response.cookies.set(STARTUP_COOKIE, id, { path: "/", sameSite: "lax" });
  return response;
}

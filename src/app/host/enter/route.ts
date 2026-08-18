import { NextResponse } from "next/server";
import { HOST_COOKIE, isProduction } from "@/lib/auth";
import { getHost } from "@/lib/hosts";

export async function GET(request: Request) {
  if (isProduction()) {
    return NextResponse.redirect(new URL("/host", request.url));
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!(await getHost(id))) {
    return NextResponse.redirect(new URL("/host", url.origin));
  }
  const response = NextResponse.redirect(
    new URL("/host/dashboard", url.origin),
  );
  response.cookies.set(HOST_COOKIE, id, { path: "/", sameSite: "lax" });
  return response;
}

import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(
    new URL("/admin/overview", url.origin),
  );
  response.cookies.set(ADMIN_COOKIE, "1", { path: "/", sameSite: "lax" });
  return response;
}

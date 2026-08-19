import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { isOpsUnlocked, OPS_COOKIE } from "@/lib/ops-gate";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!(await isOpsUnlocked((await cookies()).get(OPS_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/admin", url.origin));
  }
  const response = NextResponse.redirect(
    new URL("/admin/overview", url.origin),
  );
  response.cookies.set(ADMIN_COOKIE, "1", { path: "/", sameSite: "lax" });
  return response;
}

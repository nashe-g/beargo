import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";
import { isOpsUnlocked, OPS_COOKIE } from "@/lib/ops-gate";
import { getMerchant } from "@/lib/promotions";

export async function GET(request: Request) {
  if (!(await isOpsUnlocked((await cookies()).get(OPS_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/merchant", request.url));
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!(await getMerchant(id))) {
    return NextResponse.redirect(new URL("/merchant", url.origin));
  }
  const next = safeNext(url.searchParams.get("next"), "/merchant/dashboard");
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.set(MERCHANT_COOKIE, id, { path: "/", sameSite: "lax" });
  return response;
}

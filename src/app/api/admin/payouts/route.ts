import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { markHostEarningPaid, markHostEarningsPending } from "@/lib/store";

export async function POST(request: Request) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    hostId?: string;
    entryId?: string;
    action?: string;
  };
  if (body.action === "pending" && body.hostId) {
    await markHostEarningsPending(body.hostId);
    await audit("admin", "payout.pending", { hostId: body.hostId });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "paid" && body.entryId) {
    await markHostEarningPaid(body.entryId);
    await audit("admin", "payout.paid", { entryId: body.entryId });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid payout action" }, { status: 400 });
}

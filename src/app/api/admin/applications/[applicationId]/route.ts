import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import {
  getApplication,
  setApplicationStatus,
} from "@/lib/applications";
import { audit } from "@/lib/audit";
import { upsertUser } from "@/lib/auth";
import { upsertHost, upsertStartup } from "@/lib/catalog";

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const admin = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { applicationId } = await context.params;
  const body = (await request.json()) as { action?: string };
  const application = await getApplication(applicationId);
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (body.action === "reject") {
    await setApplicationStatus(applicationId, "rejected");
    await audit("admin", "application.reject", { applicationId });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "approve") {
    if (application.kind === "host") {
      const host = await upsertHost({
        displayName: application.payload.name,
        timezone: application.payload.timezone || "America/Chicago",
        city: application.payload.city || "Houston",
        neighborhood: application.payload.neighborhood || null,
      });
      await upsertUser({
        email: application.payload.email,
        role: "host",
        hostId: host.id,
      });
    } else {
      const startup = await upsertStartup({
        displayName: application.payload.name,
        oneLiner: application.payload.oneLiner || application.payload.name,
      });
      await upsertUser({
        email: application.payload.email,
        role: "startup",
        startupId: startup.id,
      });
    }
    await setApplicationStatus(applicationId, "approved");
    await audit("admin", "application.approve", { applicationId });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

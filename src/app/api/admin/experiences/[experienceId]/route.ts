import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { readJson, requireAdminApi } from "@/lib/admin-api";
import type { AdaptationMode, ExperienceBody } from "@/lib/experience";
import { getExperience, saveExperience } from "@/lib/experience-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ experienceId: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { experienceId } = await context.params;
  const row = await getExperience(experienceId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ experience: row });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ experienceId: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { experienceId } = await context.params;
  const body = (await readJson(request)) as {
    adaptationMode?: AdaptationMode;
    notes?: string | null;
    body?: ExperienceBody;
  } | null;
  const saved = await saveExperience(experienceId, body ?? {});
  if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("admin", "experiences.save", { id: saved.id, seedId: saved.seedId });
  return NextResponse.json({ experience: saved });
}

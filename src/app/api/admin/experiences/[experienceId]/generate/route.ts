import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { adaptationModeForSeed } from "@/lib/experience";
import { generateExperienceDraft } from "@/lib/experience-generate";
import { getExperience, saveExperience } from "@/lib/experience-store";
import { getInspirationSeed } from "@/lib/inspiration-library";

export async function POST(
  _request: Request,
  context: { params: Promise<{ experienceId: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { experienceId } = await context.params;
  const current = await getExperience(experienceId);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const seed = getInspirationSeed(current.seedId);
  if (!seed) {
    return NextResponse.json({ error: "Seed missing from library." }, { status: 400 });
  }

  const result = await generateExperienceDraft({
    seed,
    adaptationMode: adaptationModeForSeed(seed, current.adaptationMode),
    notes: current.notes,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const saved = await saveExperience(experienceId, { body: result.body });
  await audit("admin", "experiences.generate", {
    id: experienceId,
    seedId: current.seedId,
    mode: current.adaptationMode,
    model: result.model,
  });
  return NextResponse.json({ experience: saved, model: result.model });
}

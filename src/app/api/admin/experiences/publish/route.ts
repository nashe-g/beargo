import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { readJson, requireAdminApi } from "@/lib/admin-api";
import { getExperience, publishCohort } from "@/lib/experience-store";

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await readJson(request)) as { experienceIds?: string[] } | null;
  const experienceIds = body?.experienceIds;
  if (!Array.isArray(experienceIds) || experienceIds.length < 1) {
    return NextResponse.json({ error: "Pick 1 to 7 experiences." }, { status: 400 });
  }

  const rows = [];
  for (const id of experienceIds) {
    const row = await getExperience(id);
    if (!row) {
      return NextResponse.json({ error: "Experience missing." }, { status: 400 });
    }
    rows.push(row);
  }

  try {
    const result = await publishCohort(experienceIds);
    if (!result.ok) {
      return NextResponse.json({ error: result.blockers.join(" ") }, { status: 400 });
    }
    await audit("admin", "experiences.publish", {
      cohortId: result.cohortId,
      dayOne: result.dayOne,
      experienceIds,
      seedIds: rows.map((row) => row.seedId),
      modes: rows.map((row) => row.adaptationMode),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publish failed." },
      { status: 400 },
    );
  }
}

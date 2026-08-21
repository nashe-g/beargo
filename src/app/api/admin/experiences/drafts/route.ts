import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { readJson, requireAdminApi } from "@/lib/admin-api";
import {
  adaptationModeForSeed,
  flattenSeedForProduct,
  type AdaptationMode,
  type InspirationSeed,
} from "@/lib/experience";
import { createDrafts } from "@/lib/experience-store";
import { getInspirationSeed } from "@/lib/inspiration-library";

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await readJson(request)) as {
    items?: {
      seedId?: string;
      seed?: InspirationSeed;
      adaptationMode?: AdaptationMode;
      notes?: string;
    }[];
  } | null;
  const items = body?.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 7) {
    return NextResponse.json(
      { error: "Send 1 to 7 seeds." },
      { status: 400 },
    );
  }

  const seeds = [];
  for (const item of items) {
    const raw = item.seed ?? (item.seedId ? getInspirationSeed(item.seedId) : null);
    if (!raw) {
      return NextResponse.json(
        { error: `Unknown seed ${item.seedId ?? ""}.` },
        { status: 400 },
      );
    }
    const seed = flattenSeedForProduct(raw);
    seeds.push({
      seed,
      adaptationMode: adaptationModeForSeed(
        seed,
        item.adaptationMode === "near_adopt" ? "near_adopt" : "inspired",
      ),
      notes: item.notes,
    });
  }

  const created = await createDrafts({ seeds });
  await audit("admin", "experiences.draft", {
    ids: created.map((row) => row.id),
    seedIds: created.map((row) => row.seedId),
  });
  return NextResponse.json({ experiences: created });
}

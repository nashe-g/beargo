import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOST_COOKIE } from "@/lib/auth";
import { getHost, upsertHost } from "@/lib/catalog";
import { PROMOTION_CATEGORIES } from "@/lib/offer";

export async function POST(request: Request) {
  const hostId = (await cookies()).get(HOST_COOKIE)?.value;
  const host = hostId ? await getHost(hostId) : null;
  if (!host) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { excludedCategories?: string[] };
  const allowed = new Set(PROMOTION_CATEGORIES.map((row) => row.id));
  const excludedCategories = (body.excludedCategories ?? []).filter((id) =>
    allowed.has(id as (typeof PROMOTION_CATEGORIES)[number]["id"]),
  );
  await upsertHost({
    ...host,
    excludedCategories,
  });
  return NextResponse.json({ ok: true });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOST_COOKIE } from "@/lib/auth";
import { getHost, upsertHost } from "@/lib/catalog";
import { listPromotions } from "@/lib/promotions";

export async function POST(request: Request) {
  const hostId = (await cookies()).get(HOST_COOKIE)?.value;
  const host = hostId ? await getHost(hostId) : null;
  if (!host) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { excludedPromotionIds?: string[] };
  const known = new Set((await listPromotions()).map((row) => row.id));
  const excludedPromotionIds = (body.excludedPromotionIds ?? []).filter((id) =>
    known.has(String(id)),
  );
  await upsertHost({
    ...host,
    excludedPromotionIds,
  });
  return NextResponse.json({ ok: true });
}

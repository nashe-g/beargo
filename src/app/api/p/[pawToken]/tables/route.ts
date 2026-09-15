import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getPaw } from "@/lib/paws";
import { parseDeviceHint, ensureDeviceCookie } from "@/lib/scan-session";
import { createNightTable } from "@/lib/night-tables";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "table-write"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  let body: { name?: unknown; nickname?: unknown; deviceHint?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deviceKey = await ensureDeviceCookie(
    undefined,
    parseDeviceHint(body.deviceHint),
  );
  const result = await createNightTable({
    paw,
    deviceKey,
    name: body.name,
    nickname: body.nickname,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.table);
}

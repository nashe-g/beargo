import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getPaw } from "@/lib/paws";
import { parseDeviceHint, ensureDeviceCookie } from "@/lib/scan-session";
import { readyNightTable } from "@/lib/night-tables";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string; code: string }> },
) {
  if (!rateLimit(clientKey(request, "table-write"), 40, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken, code } = await context.params;
  const paw = await getPaw(pawToken);
  let body: { deviceHint?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const deviceKey = await ensureDeviceCookie(
    undefined,
    parseDeviceHint(body.deviceHint),
  );
  const result = await readyNightTable({ paw, deviceKey, code });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.table);
}

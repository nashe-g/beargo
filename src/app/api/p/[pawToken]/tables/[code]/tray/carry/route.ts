import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getPaw } from "@/lib/paws";
import { parseDeviceHint, ensureDeviceCookie } from "@/lib/scan-session";
import { submitTray } from "@/lib/night-tables";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string; code: string }> },
) {
  if (!rateLimit(clientKey(request, "table-write"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken, code } = await context.params;
  const paw = await getPaw(pawToken);
  let body: { deviceHint?: unknown; carries?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deviceKey = await ensureDeviceCookie(
    undefined,
    parseDeviceHint(body.deviceHint),
  );
  const result = await submitTray({
    paw,
    deviceKey,
    code,
    carries: body.carries,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.table);
}

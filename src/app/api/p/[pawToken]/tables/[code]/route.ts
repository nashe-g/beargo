import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getPaw } from "@/lib/paws";
import { ensureDeviceCookie, parseDeviceHint } from "@/lib/scan-session";
import { getTableByCode } from "@/lib/night-tables";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string; code: string }> },
) {
  if (!rateLimit(clientKey(request, "table-read"), 60, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken, code } = await context.params;
  const paw = await getPaw(pawToken);
  const deviceKey = await ensureDeviceCookie(
    undefined,
    parseDeviceHint(new URL(request.url).searchParams.get("deviceHint")),
  );
  const result = await getTableByCode(paw, code, deviceKey);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.table);
}

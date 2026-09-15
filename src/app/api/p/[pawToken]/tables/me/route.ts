import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getPaw } from "@/lib/paws";
import { ensureDeviceCookie, parseDeviceHint } from "@/lib/scan-session";
import { tableForDeviceTonight } from "@/lib/night-tables";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "table-read"), 60, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const deviceKey = await ensureDeviceCookie(
    undefined,
    parseDeviceHint(new URL(request.url).searchParams.get("deviceHint")),
  );
  const table = await tableForDeviceTonight(paw, deviceKey);
  return Response.json({ table });
}

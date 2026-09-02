import { FEED_ROOM_ENABLED } from "@/lib/config";
import { nightViewFor } from "@/lib/feed-night";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "night-read"), 60, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!FEED_ROOM_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 404 });
  }
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  return Response.json(await nightViewFor(paw));
}

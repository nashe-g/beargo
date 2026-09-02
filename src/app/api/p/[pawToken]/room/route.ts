import { FEED_ROOM_ENABLED } from "@/lib/config";
import { roomSnapshot } from "@/lib/feed-room";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "room-read"), 60, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!FEED_ROOM_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 404 });
  }
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const snapshot = await roomSnapshot(paw);
  return Response.json(snapshot);
}

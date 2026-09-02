import { FEED_ROOM_ENABLED } from "@/lib/config";
import { reportRoomPost } from "@/lib/feed-store";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string; postId: string }> },
) {
  if (!rateLimit(clientKey(request, "room-report"), 12, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!FEED_ROOM_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 404 });
  }
  const { pawToken, postId } = await context.params;
  const paw = await getPaw(pawToken);
  let body: { reason?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const result = await reportRoomPost({ paw, postId, reason: body.reason });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}

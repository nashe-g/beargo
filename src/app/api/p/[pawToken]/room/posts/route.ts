import { FEED_ROOM_ENABLED } from "@/lib/config";
import { createRoomPost } from "@/lib/feed-store";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  if (!rateLimit(clientKey(request, "room-write"), 30, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!FEED_ROOM_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 404 });
  }
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  let body: { body?: unknown; parentPostId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await createRoomPost({
    paw,
    body: body.body,
    parentPostId: body.parentPostId,
  });
  if (!result.ok) {
    return Response.json(
      { error: result.error, reason: result.reason },
      { status: result.status },
    );
  }
  return Response.json(result.post);
}

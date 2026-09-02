import { FEED_ROOM_ENABLED } from "@/lib/config";
import { deleteOwnPost } from "@/lib/feed-store";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ pawToken: string; postId: string }> },
) {
  if (!rateLimit(clientKey(request, "room-delete"), 20, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  if (!FEED_ROOM_ENABLED) {
    return Response.json({ error: "Not tonight" }, { status: 404 });
  }
  const { pawToken, postId } = await context.params;
  const paw = await getPaw(pawToken);
  const result = await deleteOwnPost({ paw, postId });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}

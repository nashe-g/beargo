import { createApplication } from "@/lib/applications";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "apply"), 6, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const body = (await request.json()) as {
    kind?: string;
    payload?: Record<string, string>;
  };
  if (body.kind !== "host" && body.kind !== "merchant") {
    return Response.json({ error: "Invalid application" }, { status: 400 });
  }
  const payload = body.payload ?? {};
  if (!payload.email?.includes("@") || !payload.name) {
    return Response.json({ error: "Name and email required" }, { status: 400 });
  }
  const id = await createApplication(body.kind, payload);
  return Response.json({ ok: true, id });
}

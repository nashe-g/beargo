import { finishLead } from "@/lib/store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/leads/[leadId]/finish">,
) {
  const { leadId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as {
    answers?: unknown;
    consent?: unknown;
  };

  if (
    !record.consent ||
    !record.answers ||
    typeof record.answers !== "object" ||
    Array.isArray(record.answers)
  ) {
    return Response.json({ error: "Qualification incomplete" }, { status: 400 });
  }

  const answers = Object.fromEntries(
    Object.entries(record.answers as Record<string, unknown>).map(
      ([key, value]) => [key, String(value ?? "")],
    ),
  );

  const result = await finishLead({ leadId, answers });

  if (!result.ok) {
    const error =
      result.reason === "duplicate"
        ? "Already connected"
        : result.reason === "unverified"
          ? "Email not verified"
          : result.reason === "qualification"
            ? "Qualification incomplete"
            : "Lead not found";
    return Response.json({ error, reason: result.reason }, { status: 400 });
  }

  return Response.json({
    status: result.lead.status,
    hostAmount: result.lead.hostAmount,
  });
}

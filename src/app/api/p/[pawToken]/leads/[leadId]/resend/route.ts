import { publicOrigin } from "@/lib/config";
import { sendVerificationEmail } from "@/lib/verification-email";
import { rotateVerificationToken } from "@/lib/store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/leads/[leadId]/resend">,
) {
  const { pawToken, leadId } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const emailRaw = (body as { email?: unknown }).email;
  const email =
    typeof emailRaw === "string" && emailRaw.includes("@")
      ? emailRaw.trim()
      : undefined;

  const rotated = await rotateVerificationToken({ leadId, email });
  if (!rotated.ok) {
    const status =
      rotated.reason === "rate"
        ? 429
        : rotated.reason === "duplicate"
          ? 409
          : 400;
    const error =
      rotated.reason === "rate"
        ? "Wait a moment before sending another email."
        : rotated.reason === "duplicate"
          ? "That email is already connected."
          : rotated.reason === "verified"
            ? "Already verified"
            : "Lead not found";
    return Response.json({ error, reason: rotated.reason }, { status });
  }

  if (rotated.lead.pawToken !== pawToken) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const sent = await sendVerificationEmail({
    to: rotated.lead.email,
    origin: publicOrigin(request),
    pawToken,
    token: rotated.verifyToken,
  });

  return Response.json({
    mailSent: sent.ok,
    email: rotated.lead.email,
  });
}

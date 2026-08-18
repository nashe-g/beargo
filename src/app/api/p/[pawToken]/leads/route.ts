import { cookies } from "next/headers";
import { publicOrigin } from "@/lib/config";
import { isEligibleInterest } from "@/lib/campaigns";
import { getCampaign } from "@/lib/catalog";
import { sendVerificationEmail } from "@/lib/verification-email";
import { getPaw } from "@/lib/paws";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { SCAN_COOKIE, stampSession } from "@/lib/scan-session";
import { createLead, markVerificationEmailSent } from "@/lib/store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/leads">,
) {
  if (!rateLimit(clientKey(request, "lead"), 12, 60_000)) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }

  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const sessionId = (await cookies()).get(SCAN_COOKIE)?.value ?? null;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as {
    campaignId?: unknown;
    interestId?: unknown;
    fullName?: unknown;
    email?: unknown;
    phone?: unknown;
  };

  const fullName = String(record.fullName ?? "").trim();
  const email = String(record.email ?? "").trim();
  const phone = String(record.phone ?? "").trim();
  const interestId = String(record.interestId ?? "try");
  const campaign = await getCampaign(String(record.campaignId ?? ""));

  if (!fullName || !email.includes("@") || phone.replace(/\D/g, "").length < 10) {
    return Response.json({ error: "Invalid details" }, { status: 400 });
  }

  if (!campaign || !isEligibleInterest(campaign, interestId)) {
    return Response.json({ error: "Invalid campaign" }, { status: 400 });
  }

  try {
    const { lead, verifyToken } = await createLead({
      paw,
      campaign,
      interestId,
      fullName,
      email,
      phone,
      sessionId,
    });

    if (sessionId) {
      await stampSession(sessionId, "lead", {
        leadId: lead.id,
        interestId,
        campaignId: campaign.id,
      });
    }

    let mailSent = false;
    if (lead.status !== "duplicate" && verifyToken) {
      const sent = await sendVerificationEmail({
        to: lead.email,
        origin: publicOrigin(request),
        pawToken: lead.pawToken,
        token: verifyToken,
      });
      mailSent = sent.ok;
      if (sent.ok) await markVerificationEmailSent(lead.id);
    }

    return Response.json({
      status: lead.status,
      leadId: lead.id,
      email: lead.email,
      mailSent,
    });
  } catch {
    return Response.json({ error: "Invalid campaign" }, { status: 400 });
  }
}

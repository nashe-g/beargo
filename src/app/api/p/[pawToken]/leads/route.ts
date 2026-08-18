import { publicOrigin } from "@/lib/config";
import { isEligibleInterest } from "@/lib/campaigns";
import { getCampaign } from "@/lib/campaign-resolve";
import { sendVerificationEmail } from "@/lib/verification-email";
import { getPaw } from "@/lib/paws";
import { createLead, markVerificationEmailSent } from "@/lib/store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/p/[pawToken]/leads">,
) {
  const { pawToken } = await context.params;
  const paw = getPaw(pawToken);

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
  const campaign = getCampaign(String(record.campaignId ?? ""));

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
    });

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

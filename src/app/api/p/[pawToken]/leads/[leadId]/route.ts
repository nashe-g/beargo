import { getPaw } from "@/lib/paws";
import { mailMode } from "@/lib/mail";
import { getLead } from "@/lib/store";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/p/[pawToken]/leads/[leadId]">,
) {
  const { pawToken, leadId } = await context.params;
  await getPaw(pawToken);
  const lead = await getLead(leadId);
  if (!lead || lead.pawToken !== pawToken) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  return Response.json({
    status: lead.status,
    emailVerified: lead.emailVerified,
    email: lead.email,
    mailMode: mailMode(),
  });
}

import { publicOrigin } from "@/lib/config";
import { sendMail } from "@/lib/mail";
import type { PlayerRecord } from "@/lib/players";

export async function sendClaimVerification(input: {
  player: PlayerRecord;
  token: string;
  pawToken: string;
  origin: string;
}) {
  const url = new URL(`/p/${input.pawToken}/claim/verify`, input.origin);
  url.searchParams.set("t", input.token);
  const link = url.toString();
  return sendMail({
    to: input.player.email,
    subject: "Confirm your BearGo offer",
    text: `Hi ${input.player.fullName.split(" ")[0]},\n\nTap to confirm your email and get your voucher:\n${link}\n\nThis link expires in 30 minutes.`,
    html: `<p>Hi ${escapeHtml(input.player.fullName.split(" ")[0])},</p><p>Tap to confirm your email and get your voucher.</p><p><a href="${link}">Get my voucher</a></p><p>This link expires in 30 minutes.</p>`,
  });
}

export function claimMailOrigin(request: Request) {
  return publicOrigin(request);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

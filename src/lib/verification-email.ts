import { APP_NAME } from "@/lib/config";
import { sendMail } from "@/lib/mail";

export function verificationUrl(
  origin: string,
  pawToken: string,
  token: string,
) {
  const url = new URL(`/p/${encodeURIComponent(pawToken)}/verify`, origin);
  url.searchParams.set("t", token);
  return url.toString();
}

export function verificationEmail(input: {
  origin: string;
  pawToken: string;
  token: string;
}) {
  const href = verificationUrl(input.origin, input.pawToken, input.token);
  const subject = "Verify your email to finish the introduction";
  const text = [
    "You're almost done.",
    "",
    "VERIFY & CONTINUE",
    href,
    "",
    `This link is from ${APP_NAME}. It does not create an account with the sponsor.`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#1c140c;color:#f3e6d0;font-family:Georgia,serif;">
    <div style="max-width:32rem;margin:0 auto;padding:2rem 1.25rem;">
      <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:0.75rem;color:#e3a012;">
        ${APP_NAME}
      </p>
      <h1 style="font-size:2rem;line-height:1.2;">You're almost done.</h1>
      <p style="font-size:1.1rem;line-height:1.5;color:#e6d3b4;">
        Verify your email to finish the introduction. This does not create an
        account with the sponsor.
      </p>
      <p style="margin:2rem 0;">
        <a href="${href}" style="display:inline-block;background:#e3a012;color:#1c140c;text-decoration:none;font-weight:700;letter-spacing:0.12em;padding:0.95rem 1.5rem;border-radius:999px;">
          VERIFY &amp; CONTINUE
        </a>
      </p>
      <p style="font-size:0.85rem;color:#e6d3b4;word-break:break-all;">${href}</p>
    </div>
  </body>
</html>`;

  return { subject, text, html, href };
}

export async function sendVerificationEmail(input: {
  to: string;
  origin: string;
  pawToken: string;
  token: string;
}) {
  const email = verificationEmail(input);
  const result = await sendMail({
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  return { ...result, href: email.href };
}

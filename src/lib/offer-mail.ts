import { CANONICAL_ORIGIN } from "@/lib/config";
import { formatStamp } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { offerTitle } from "@/lib/offer";
import type { PromotionRecord } from "@/lib/promotions";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function adminInbox() {
  return process.env.ADMIN_NOTIFY_EMAIL ?? "admin@beargo.pro";
}

function offerSummary(promotion: PromotionRecord) {
  const title = offerTitle(promotion);
  const until = promotion.endsAt
    ? formatStamp(
        promotion.endsAt.toISOString(),
        promotion.location.timezone,
      )
    : "no end date";
  return {
    title,
    merchant: promotion.merchant.displayName,
    address: promotion.location.address,
    until,
  };
}

export async function emailAdminOfferSubmitted(
  promotion: PromotionRecord,
  origin = CANONICAL_ORIGIN,
) {
  const summary = offerSummary(promotion);
  const reviewUrl = `${origin.replace(/\/$/, "")}/admin/promotions`;
  const text = `${summary.merchant} submitted an offer for review.

${summary.title}
${summary.address}
Players can claim until ${summary.until}

Review it:
${reviewUrl}`;
  return sendMail({
    to: adminInbox(),
    subject: `Offer to review: ${summary.title} · ${summary.merchant}`,
    text,
    html: `<p>${escapeHtml(summary.merchant)} submitted an offer for review.</p><p><strong>${escapeHtml(summary.title)}</strong><br>${escapeHtml(summary.address)}<br>Players can claim until ${escapeHtml(summary.until)}</p><p><a href="${reviewUrl}">Review offers</a></p>`,
  });
}

export async function emailMerchantOfferApproved(
  to: string[],
  promotion: PromotionRecord,
) {
  if (to.length === 0) return { ok: false as const };
  const summary = offerSummary(promotion);
  const text = `Your BearGo offer is live.

${summary.title}
Players nearby can see it after they finish the game, until ${summary.until}.`;
  const html = `<p>Your BearGo offer is live.</p><p><strong>${escapeHtml(summary.title)}</strong></p><p>Players nearby can see it after they finish the game, until ${escapeHtml(summary.until)}.</p>`;
  const results = await Promise.all(
    to.map((email) =>
      sendMail({
        to: email,
        subject: `Your BearGo offer is live: ${summary.title}`,
        text,
        html,
      }),
    ),
  );
  return { ok: results.some((row) => row.ok) };
}

export async function emailMerchantOfferDeclined(
  to: string[],
  promotion: PromotionRecord,
  reason: string,
) {
  if (to.length === 0) return { ok: false as const };
  const summary = offerSummary(promotion);
  const text = `BearGo could not approve this offer.

${summary.title}

Reason: ${reason}

You can submit a new offer from your Offers page.`;
  const html = `<p>BearGo could not approve this offer.</p><p><strong>${escapeHtml(summary.title)}</strong></p><p>Reason: ${escapeHtml(reason)}</p><p>You can submit a new offer from your Offers page.</p>`;
  const results = await Promise.all(
    to.map((email) =>
      sendMail({
        to: email,
        subject: `BearGo could not approve this offer: ${summary.title}`,
        text,
        html,
      }),
    ),
  );
  return { ok: results.some((row) => row.ok) };
}

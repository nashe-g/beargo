export function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatStamp(iso: string, timeZone: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function offerWindowLabel(input: {
  status: string;
  until: string | null;
  reviewNote?: string | null;
}) {
  if (input.status === "pending") {
    return "Waiting for BearGo to review. Not live yet.";
  }
  if (input.status === "rejected") {
    return input.reviewNote
      ? `Declined: ${input.reviewNote}`
      : "Declined by BearGo.";
  }
  if (input.status === "cancelled") {
    return input.until
      ? `No new claims. Issued vouchers valid through ${input.until}`
      : "No new claims. Issued vouchers stay valid.";
  }
  if (input.status === "ended") {
    return input.until ? `Ended ${input.until}` : "Ended";
  }
  return input.until
    ? `Until ${input.until} · not shown to players`
    : "No end date · not shown to players";
}

export function formatClock(ms: number) {
  return `${(ms / 1000).toFixed(1)} sec`;
}

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
}) {
  if (input.status === "cancelled") {
    return input.until
      ? `No new claims. Issued vouchers valid through ${input.until}`
      : "No new claims. Issued vouchers stay valid.";
  }
  if (input.status === "ended") {
    return input.until ? `Ended ${input.until}` : "Ended";
  }
  return input.until
    ? `Players can claim until ${input.until}`
    : "No end date set";
}

export function formatClock(ms: number) {
  return `${(ms / 1000).toFixed(1)} sec`;
}

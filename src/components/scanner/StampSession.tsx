"use client";

import { useEffect } from "react";

export function StampSession({
  pawToken,
  event,
  promotionId,
  voucherId,
}: {
  pawToken: string;
  event: string;
  promotionId?: string;
  voucherId?: string;
}) {
  useEffect(() => {
    fetch(`/api/p/${pawToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, promotionId, voucherId }),
    }).catch(() => undefined);
  }, [pawToken, event, promotionId, voucherId]);
  return null;
}

"use client";

import { useEffect } from "react";

export function StampSession({
  pawToken,
  event,
  promotionId,
  voucherId,
  from,
}: {
  pawToken: string;
  event: string;
  promotionId?: string;
  voucherId?: string;
  from?: string | null;
}) {
  useEffect(() => {
    fetch(`/api/p/${pawToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, promotionId, voucherId, from }),
    }).catch(() => undefined);
  }, [pawToken, event, promotionId, voucherId, from]);
  return null;
}

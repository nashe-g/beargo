"use client";

import { useEffect } from "react";

export function StampSession({
  pawToken,
  event,
  interestId,
  campaignId,
}: {
  pawToken: string;
  event: string;
  interestId?: string;
  campaignId?: string;
}) {
  useEffect(() => {
    fetch(`/api/p/${pawToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, interestId, campaignId }),
    }).catch(() => undefined);
  }, [pawToken, event, interestId, campaignId]);
  return null;
}

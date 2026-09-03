"use client";

import { useEffect } from "react";

const DEVICE_KEY = "beargo:device";

function deviceHint() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export type StampResult = {
  handle: string | null;
};

export function StampSession({
  pawToken,
  event,
  promotionId,
  voucherId,
  from,
  onStamped,
}: {
  pawToken: string;
  event: string;
  promotionId?: string;
  voucherId?: string;
  from?: string | null;
  onStamped?: (result: StampResult) => void;
}) {
  useEffect(() => {
    fetch(`/api/p/${pawToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        promotionId,
        voucherId,
        deviceHint: deviceHint(),
        ...(from === undefined ? {} : { from }),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { handle?: string } | null) => {
        onStamped?.({ handle: body?.handle ?? null });
      })
      .catch(() => onStamped?.({ handle: null }));
  }, [pawToken, event, promotionId, voucherId, from, onStamped]);
  return null;
}

"use client";

import { useState } from "react";
import type { PawRecord } from "@/lib/paws";
import {
  shareCardImagePath,
  shareCardPath,
  shareCardText,
  type ShareCardStats,
} from "@/lib/share-card";

export function ShareRank({
  paw,
  stats,
}: {
  paw: PawRecord;
  stats: ShareCardStats;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const origin = window.location.origin;
    const url = `${origin}${shareCardPath(paw.token, stats)}`;
    const text = shareCardText(paw.hostDisplayName, stats);
    const title = `BearGo at ${paw.hostDisplayName}`;

    try {
      const image = await fetch(shareCardImagePath(paw.token, stats));
      if (image.ok && navigator.canShare) {
        const file = new File(
          [await image.blob()],
          "beargo.png",
          { type: "image/png" },
        );
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text, files: [file] });
          return;
        }
      }
    } catch {
      // Fall through to a link share.
    }

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // Fall through to copy.
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="flex h-14 w-full items-center justify-center rounded-full border border-paper/20 text-lg font-semibold text-paper"
    >
      {copied ? "Copied" : "Share this rank"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { GamePlay } from "@/components/scanner/GamePlay";
import type { ExperienceBody } from "@/lib/experience";

export function ExperiencePreview({
  body,
  open,
  onClose,
}: {
  body: ExperienceBody;
  open: boolean;
  onClose: () => void;
}) {
  const [run, setRun] = useState(0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
      <div className="flex max-h-[95dvh] w-full max-w-md flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-paper">
          <p className="text-sm tracking-[0.16em] uppercase text-paper/70">
            Phone preview
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRun((value) => value + 1)}
              className="h-10 rounded-full border border-paper/30 px-4 text-sm"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full bg-honey px-4 text-sm font-semibold text-ink"
            >
              Close
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-honey/20 shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          <div className="h-[min(44rem,calc(95dvh-5rem))]">
            <GamePlay
              key={run}
              preview
              session={{
                body,
                id: "preview",
                localDate: "preview",
                experienceId: null,
                format: body.format,
                source: "scheduled",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

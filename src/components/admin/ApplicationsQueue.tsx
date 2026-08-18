"use client";

import { useRouter } from "next/navigation";
import type { Application } from "@/lib/applications";

export function ApplicationsQueue({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/applications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  return (
    <ul className="mt-8 space-y-4">
      {applications.map((application) => (
        <li
          key={application.id}
          className="rounded-3xl border border-ink/10 px-5 py-5"
        >
          <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
            {application.kind}
          </p>
          <h2 className="mt-2 font-display text-2xl">
            {application.payload.name}
          </h2>
          <p className="mt-1 text-ink-soft">{application.payload.email}</p>
          <p className="mt-2 text-sm">{application.payload.oneLiner}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => act(application.id, "approve")}
              className="h-11 rounded-full bg-ink px-5 text-paper"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => act(application.id, "reject")}
              className="h-11 rounded-full border border-ink/20 px-5"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

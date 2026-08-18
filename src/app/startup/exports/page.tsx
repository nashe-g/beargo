import Link from "next/link";
import { StartupShell } from "@/components/startup/StartupShell";
import { formatStamp } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import { qualifiedLeadsForStartup } from "@/lib/startup-stats";
import { listExports, listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupExportsPage() {
  const startup = await requireStartup();
  const [leads, exports] = await Promise.all([
    listLeads(),
    listExports(startup.id),
  ]);
  const ready = qualifiedLeadsForStartup(startup.id, leads).length;

  return (
    <StartupShell startup={startup} current="/startup/exports">
      <h1 className="font-display text-4xl">Exports</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Qualified leads only. Every download is logged.
      </p>

      <Link
        href="/startup/leads/export"
        className="mt-8 flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-ink text-paper"
      >
        Download CSV · {ready} ready
      </Link>

      <h2 className="mt-12 font-display text-2xl">History</h2>
      {exports.length === 0 ? (
        <p className="mt-4 text-ink-soft">No exports yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 rounded-3xl border border-ink/10">
          {exports.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <span>
                {formatStamp(row.createdAt, "America/Chicago")}
              </span>
              <span className="text-ink-soft">{row.leadCount} leads</span>
            </li>
          ))}
        </ul>
      )}
    </StartupShell>
  );
}

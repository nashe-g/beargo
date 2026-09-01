import Link from "next/link";
import { HostShell } from "@/components/host/HostShell";
import { PawPrint } from "@/components/paw/PawPrint";
import { PawSvgDownloads } from "@/components/paw/PawSvgDownloads";
import { CANONICAL_ORIGIN, pawScanUrl } from "@/lib/config";
import { requireHost } from "@/lib/host-auth";
import { pawsForHost } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function HostPawsPage() {
  const host = await requireHost();
  const paws = await pawsForHost(host.id);

  return (
    <HostShell host={host} current="/host/paws">
      <h1 className="font-display text-4xl">Your Paw</h1>
      <p className="mt-3 text-ink-soft">
        Print it. Put it where people already pause. Scan it yourself to check.
      </p>

      <div className="mt-8 space-y-8">
        {paws.map((paw) => (
          <article
            key={paw.token}
            className="rounded-3xl border border-ink/10 px-5 py-6"
          >
            <PawPrint
              scanUrl={pawScanUrl(paw.token, CANONICAL_ORIGIN)}
              className="mx-auto w-48 text-ink"
              label={`${host.displayName} Paw`}
            />
            <dl className="mt-6 space-y-2 text-sm">
              <Row label="Token" value={paw.token} />
              <Row label="Placement" value={paw.placementLabel} />
              <Row label="Status" value={paw.status} />
              <Row label="Scan URL" value={pawScanUrl(paw.token)} />
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/p/${paw.token}/print`}
                className="flex h-12 items-center justify-center rounded-full bg-ink text-paper"
              >
                Print-ready sign
              </Link>
              <PawSvgDownloads token={paw.token} />
              <p className="text-sm text-ink-soft">
                Table tent or bar-top. Keep the quiet zone around the QR clear.
                No sponsor logos on the physical Paw. Pick a paw color; the QR
                stays black. Transparent background for your own layouts.
              </p>
            </div>
          </article>
        ))}
      </div>
    </HostShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="break-all text-right">{value}</dd>
    </div>
  );
}

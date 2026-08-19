import { cookies } from "next/headers";
import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { PawMark } from "@/components/paw/PawMark";
import { getDemoHost } from "@/lib/hosts";
import { isOpsUnlocked, OPS_COOKIE } from "@/lib/ops-gate";

export const dynamic = "force-dynamic";

export default async function HostLoginPage() {
  const host = await getDemoHost().catch(() => null);
  const unlocked = await isOpsUnlocked(
    (await cookies()).get(OPS_COOKIE)?.value,
  );

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Host</h1>
          <p className="mt-3 text-lg text-ink-soft">
            See today’s games, your Paw, and which nearby offers can appear.
          </p>
        </div>
        <div className="space-y-4">
          <MagicLinkForm next="/host/dashboard" />
          {unlocked && host ? (
            <Link
              href={`/host/enter?id=${host.id}`}
              className="flex h-14 items-center justify-center rounded-full border border-ink/20"
            >
              Continue as {host.displayName}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

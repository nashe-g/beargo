import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";
import { getDemoHost } from "@/lib/hosts";

export default function HostLoginPage() {
  const host = getDemoHost();

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Host</h1>
          <p className="mt-3 text-lg text-ink-soft">
            See today’s games, your Paw, and potential earnings.
          </p>
        </div>
        <Link
          href="/host/dashboard"
          className="flex h-14 items-center justify-center rounded-full bg-ink text-paper"
        >
          Continue as {host.displayName}
        </Link>
      </div>
    </main>
  );
}

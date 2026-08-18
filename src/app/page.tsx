import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";
import { CANONICAL_HOST } from "@/lib/config";

export default function Home() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-28 text-ink" />
          <p className="mt-6 font-condensed text-sm tracking-[0.35em] uppercase">
            {CANONICAL_HOST}
          </p>
          <h1 className="mt-3 font-display text-5xl">BearGo</h1>
          <p className="mt-4 max-w-xs text-lg text-ink-soft">
            Scan the paw. Three questions. How do you rank here today?
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          <Link
            href="/p/demo"
            className="flex h-14 items-center justify-center rounded-full bg-ink text-paper"
          >
            Play the demo
          </Link>
          <Link
            href="/p/quiet"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Play with no sponsor
          </Link>
          <Link
            href="/host"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Host dashboard
          </Link>
          <Link
            href="/startup"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Startup dashboard
          </Link>
          <Link
            href="/admin"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Admin
          </Link>
          <Link
            href="/p/demo/print"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Print a Paw
          </Link>
          <Link
            href="/lab"
            className="flex h-14 items-center justify-center rounded-full border border-ink/20"
          >
            Motion lab
          </Link>
        </nav>
      </div>
    </main>
  );
}

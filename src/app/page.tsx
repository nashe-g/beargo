import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";

export default function Home() {
  return (
    <PublicShell>
      <div className="relative">
        <h1 className="relative max-w-2xl font-display text-4xl leading-[1.08] sm:text-6xl">
          Scan the paw. Play today’s BearGo. No account.
        </h1>
        <p className="relative mt-5 max-w-xl text-lg text-ink-soft sm:text-xl">
          BearGo is a daily challenge at real places. No account to play.
        </p>
        <div className="relative mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/p/demo"
            className="btn-honey flex h-14 items-center justify-center rounded-full bg-honey px-7 text-lg font-semibold text-ink"
          >
            Play the demo
          </Link>
          <Link
            href="/how-it-works"
            className="flex h-14 items-center justify-center rounded-full border border-ink/15 bg-pad/60 px-7"
          >
            How it works
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}

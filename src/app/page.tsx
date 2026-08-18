import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";

export default function Home() {
  return (
    <PublicShell>
      <p className="text-sm tracking-[0.35em] uppercase text-ink-soft">
        beargo.pro
      </p>
      <h1 className="mt-4 font-display text-5xl leading-tight">
        Scan the paw. Three questions. How do you rank here today?
      </h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">
        BearGo is a daily challenge at real places. Optional introductions
        come after you see your rank. No account to play.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/p/demo"
          className="flex h-14 items-center justify-center rounded-full bg-ink px-6 text-paper"
        >
          Play the demo
        </Link>
        <Link
          href="/how-it-works"
          className="flex h-14 items-center justify-center rounded-full border border-ink/20 px-6"
        >
          How it works
        </Link>
      </div>
    </PublicShell>
  );
}

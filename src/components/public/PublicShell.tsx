import Link from "next/link";
import type { ReactNode } from "react";
import { PawMark } from "@/components/paw/PawMark";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-hosts", label: "Hosts" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="paper-surface relative min-h-dvh text-ink">
      <div className="paper-grain" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <PawMark className="h-8 w-8 text-ink" />
            <span className="font-display text-[1.35rem] leading-none tracking-tight">
              BearGo
            </span>
          </Link>
          <nav className="flex items-center justify-end gap-x-5 text-sm text-ink-soft">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden whitespace-nowrap transition-colors hover:text-ink sm:inline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/p/demo?from=web"
              className="rounded-full bg-honey px-3.5 py-1.5 text-sm font-semibold text-ink shadow-[0_6px_16px_rgba(232,163,26,0.28)] transition-transform hover:-translate-y-px"
            >
              Play
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </main>
      <footer className="relative border-t border-ink/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <PawMark className="h-6 w-6 text-ink" />
              <span className="font-display text-lg">BearGo</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
              Tonight at the bar. Scan the paw. You’re in the chat. No account.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/host-terms" className="hover:text-ink">
              Host terms
            </Link>
            <Link href="/p/demo?from=web" className="hover:text-ink">
              Try the demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PublicHeading({
  kicker,
  title,
}: {
  kicker?: string;
  title: string;
}) {
  return (
    <header>
      {kicker ? (
        <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
          {kicker}
        </p>
      ) : null}
      <h1
        className={`font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl ${kicker ? "mt-3" : ""}`}
      >
        {title}
      </h1>
    </header>
  );
}

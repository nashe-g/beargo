import Link from "next/link";
import type { ReactNode } from "react";
import { PawMark } from "@/components/paw/PawMark";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-hosts", label: "Hosts" },
  { href: "/for-merchants", label: "Merchants" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="paper-surface min-h-dvh text-ink">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <PawMark className="h-8 w-8 text-ink" />
            <span className="font-display text-xl">BearGo</span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm text-ink-soft">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-5 gap-y-2 px-5 pb-12 text-sm text-ink-soft sm:px-6">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/host-terms">Host terms</Link>
        <Link href="/merchant-terms">Merchant terms</Link>
        <Link href="/p/demo">Play the demo</Link>
      </footer>
    </div>
  );
}

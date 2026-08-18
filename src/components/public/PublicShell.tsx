import Link from "next/link";
import type { ReactNode } from "react";
import { PawMark } from "@/components/paw/PawMark";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-hosts", label: "Hosts" },
  { href: "/for-startups", label: "Startups" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <PawMark className="h-8 w-8" />
            <span className="font-display text-xl">BearGo</span>
          </Link>
          <nav className="flex gap-4 text-sm text-ink-soft">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <footer className="mx-auto flex max-w-3xl flex-wrap gap-4 px-6 pb-12 text-sm text-ink-soft">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/host-terms">Host terms</Link>
        <Link href="/startup-terms">Startup terms</Link>
        <Link href="/p/demo">Play the demo</Link>
      </footer>
    </div>
  );
}

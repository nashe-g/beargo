import type { ReactNode } from "react";
import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";
import type { HostRecord } from "@/lib/hosts";

const LINKS = [
  { href: "/host/dashboard", label: "Today" },
  { href: "/host/challenges", label: "Challenge" },
  { href: "/host/paws", label: "Paw" },
  { href: "/host/exclusions", label: "Offers" },
];

export function HostShell({
  host,
  current,
  children,
}: {
  host: HostRecord;
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/host/dashboard" className="flex items-center gap-2">
            <PawMark className="h-8 w-8" />
            <span className="font-display text-xl">{host.displayName}</span>
          </Link>
          <Link href="/" className="text-sm text-ink-soft">
            BearGo
          </Link>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-3 pb-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm ${
                current === link.href
                  ? "bg-ink text-paper"
                  : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";
import type { MerchantRecord } from "@/lib/promotions";

const LINKS = [
  { href: "/merchant/dashboard", label: "Overview" },
  { href: "/merchant/promotions", label: "Offers" },
  { href: "/merchant/redeem", label: "Redeem" },
  { href: "/merchant/billing", label: "Fees" },
];

export function MerchantShell({
  merchant,
  current,
  children,
}: {
  merchant: MerchantRecord;
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/merchant/dashboard" className="flex items-center gap-3">
            <PawMark className="h-8 w-8" />
            <span className="font-display text-xl">{merchant.displayName}</span>
          </Link>
          <div className="flex items-center gap-5 text-sm text-ink-soft">
            <span>$1 per redemption</span>
            <Link href="/merchant">Switch</Link>
            <Link href="/">BearGo</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm ${
                current === link.href ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-3xl border border-ink/10 px-5 py-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      {note ? <p className="mt-2 text-sm text-ink-soft">{note}</p> : null}
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";

const LINKS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/hosts", label: "Hosts" },
  { href: "/admin/paws", label: "Paws" },
  { href: "/admin/challenges", label: "Challenges" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/applications", label: "Apply" },
];

export function AdminShell({
  current,
  children,
}: {
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin/overview" className="flex items-center gap-3">
            <PawMark className="h-8 w-8" />
            <span className="font-display text-xl">Admin</span>
          </Link>
          <div className="flex items-center gap-5 text-sm text-ink-soft">
            <span>Ops</span>
            <Link href="/">BearGo</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 pb-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm ${
                current === link.href || current.startsWith(`${link.href}/`)
                  ? "bg-ink text-paper"
                  : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
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

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "live" || status === "active" || status === "qualified"
      ? "bg-moss text-paper"
      : status === "paused" || status === "pending_verification"
        ? "bg-ink/10 text-ink-soft"
        : status === "duplicate" || status === "ended" || status === "inactive"
          ? "bg-clay/15 text-clay"
          : "bg-ink/10 text-ink-soft";
  return (
    <span className={`rounded-full px-3 py-1 text-sm capitalize ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

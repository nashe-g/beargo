import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";

const ROLES = [
  {
    href: "/admin",
    label: "Admin",
    note: "Hosts, Paws, offers, and players.",
  },
  {
    href: "/host",
    label: "Host",
    note: "Tonight’s room, your Paw, and the boards.",
  },
  {
    href: "/merchant",
    label: "Merchant",
    note: "Offers, redeem, and the $1 fee.",
  },
];

export function StaffHome() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Staff</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Sign in as admin, host, or merchant.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ROLES.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="rounded-[1.75rem] border border-ink/15 px-5 py-4"
            >
              <span className="font-display text-2xl">{role.label}</span>
              <span className="mt-1 block text-sm text-ink-soft">
                {role.note}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

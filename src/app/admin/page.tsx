import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { PawMark } from "@/components/paw/PawMark";
import { isProduction } from "@/lib/auth";

export default function AdminLoginPage() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Admin</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Is the game network healthy, is the commercial funnel healthy, and
            is the money correct?
          </p>
        </div>
        <div className="space-y-4">
          <MagicLinkForm next="/admin/overview" />
          {!isProduction() ? (
            <Link
              href="/admin/enter"
              className="flex h-14 items-center justify-center rounded-full border border-ink/20"
            >
              Continue as admin
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { PawMark } from "@/components/paw/PawMark";

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
        <Link
          href="/admin/enter"
          className="flex h-14 items-center justify-center rounded-full bg-ink text-paper"
        >
          Continue as admin
        </Link>
      </div>
    </main>
  );
}

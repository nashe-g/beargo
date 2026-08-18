import Link from "next/link";

export default function AuthExpiredPage() {
  return (
    <main className="min-h-dvh bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-4xl">That link expired</h1>
        <p className="mt-4 text-ink-soft">
          Ask for a new sign-in link. Each link works once and lasts 30 minutes.
        </p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-5 text-paper">
          Home
        </Link>
      </div>
    </main>
  );
}

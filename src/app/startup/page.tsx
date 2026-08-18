import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { PawMark } from "@/components/paw/PawMark";
import { isProduction } from "@/lib/auth";
import { DEMO_STARTUP_ID, listStartups } from "@/lib/startups";

export const dynamic = "force-dynamic";

export default async function StartupLoginPage() {
  const startups = await listStartups();
  const primary = startups.find((startup) => startup.id === DEMO_STARTUP_ID);
  const rest = startups.filter((startup) => startup.id !== DEMO_STARTUP_ID);

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <PawMark className="w-24" />
          <h1 className="mt-6 font-display text-4xl">Startup</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Your card shows after a real game. You only pay for people who
            choose to connect. No integration required.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <MagicLinkForm next="/startup/dashboard" />
          {!isProduction() ? (
            <>
              {primary ? (
                <Link
                  href={`/startup/enter?id=${primary.id}`}
                  className="flex h-14 items-center justify-center rounded-full bg-ink text-paper"
                >
                  Continue as {primary.displayName}
                </Link>
              ) : null}
              {rest.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/startup/enter?id=${startup.id}`}
                  className="flex h-14 items-center justify-center rounded-full border border-ink/20"
                >
                  Continue as {startup.displayName}
                </Link>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { listMailLog, mailMode } from "@/lib/mail";

export const dynamic = "force-dynamic";

export default async function LabMailPage() {
  if (mailMode() !== "log") redirect("/lab");
  const messages = (await listMailLog()).slice().reverse();

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
          Lab
        </p>
        <h1 className="mt-2 font-display text-4xl">Mailbox</h1>
        <p className="mt-3 text-ink-soft">
          SMTP isn’t configured, so sign-in mail lands here instead of a
          real inbox. Set SMTP_HOST to send for real.
        </p>
        <Link href="/lab" className="mt-4 inline-block text-sm text-ink-soft">
          Motion lab
        </Link>

        {messages.length === 0 ? (
          <p className="mt-10 text-ink-soft">No mail yet.</p>
        ) : (
          <ul className="mt-10 space-y-6">
            {messages.map((message) => {
              const href = message.text
                .split("\n")
                .find((line) => line.startsWith("http"));
              return (
                <li
                  key={message.id}
                  className="rounded-3xl border border-ink/10 px-5 py-5"
                >
                  <p className="text-sm text-ink-soft">
                    To {message.to} · {new Date(message.createdAt).toLocaleString()}
                  </p>
                  <h2 className="mt-2 font-display text-2xl">
                    {message.subject}
                  </h2>
                  <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-ink-soft">
                    {message.text}
                  </pre>
                  {href ? (
                    <Link
                      href={href}
                      className="mt-5 flex h-12 items-center justify-center rounded-full bg-ink text-paper"
                    >
                      VERIFY & CONTINUE
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

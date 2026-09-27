import Link from "next/link";
import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "Sit a table.",
    body: "Name it. Friends join with a code. Solo is a table of one.",
  },
  {
    title: "Trivia.",
    body: "Each player gets three unique questions. The table is scored against the others here on accuracy and response time.",
  },
  {
    title: "The tray.",
    body: "One person carries a tray of glasses on their phone. Steadier moves the table up.",
  },
  {
    title: "A live chat.",
    body: "Open here tonight if you want to talk. A bar name, not your real one. It isn’t the prize.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <PublicHeading kicker="THE NIGHT" title="How it works" />
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        No account. Scan, sit a table, and play tonight’s games. A live chat
        is here if you want to talk. Your real name stays off it.
      </p>
      <ol className="mt-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-[1.6rem] border border-ink/10 bg-pad/70 px-5 py-6 shadow-[0_16px_36px_rgba(26,18,11,0.05)]"
          >
            <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-3 font-display text-2xl leading-tight">
              {step.title}
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
      <Link
        href="/p/demo?from=web"
        className="btn-honey mt-10 inline-flex h-14 items-center justify-center rounded-full bg-honey px-8 text-lg font-semibold text-ink"
      >
        Try the demo
      </Link>
    </PublicShell>
  );
}

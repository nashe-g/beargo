import Link from "next/link";
import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "Three questions, then a pour.",
    body: "Same set for everyone here today. Answers, the pour, and speed set your rank.",
  },
  {
    title: "See how you rank.",
    body: "That’s the game. Rank is for this place, today.",
  },
  {
    title: "Optional offers after the game.",
    body: "After you see your result, BearGo may show a sponsored or affiliate offer from a third party. Viewing or clicking it is optional and does not affect your score or rank.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <PublicHeading kicker="THE GAME" title="How it works" />
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        No account to play. About a minute.
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
        href="/p/demo"
        className="btn-honey mt-10 inline-flex h-14 items-center justify-center rounded-full bg-honey px-8 text-lg font-semibold text-ink"
      >
        Play the demo
      </Link>
    </PublicShell>
  );
}

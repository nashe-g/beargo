import Link from "next/link";
import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "Don’t drop the drinks.",
    body: "The stack leans on its own. Tap the side it’s falling toward. Three carries — 3, 4, then 5 glasses. Everyone at the venue plays the same night.",
  },
  {
    title: "Beat the room.",
    body: "You kept the drinks up. Now beat the crowd in today’s trivia. 3 curious questions. Same ones as everyone here tonight.",
  },
  {
    title: "Your rank.",
    body: "Put a name on the board. One ranked run a night per phone.",
  },
  {
    title: "Optional offers after the game.",
    body: "After you see your result, BearGo may show a sponsored offer from a third party.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <PublicHeading kicker="THE GAME" title="How it works" />
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        No account to play. Tray, then trivia. Rank is this room, tonight.
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

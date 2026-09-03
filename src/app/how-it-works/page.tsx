import Link from "next/link";
import { PublicHeading, PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "You’re in the room.",
    body: "A live chat for everyone here. The House already said something.",
  },
  {
    title: "Play from the chat.",
    body: "Carry a tray, or three questions. The dare is in the conversation.",
  },
  {
    title: "Hand the phone.",
    body: "That’s how the next person gets in. One more scan, not a download.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <PublicHeading kicker="THE NIGHT" title="How it works" />
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        No account. Scan, and you’re in this bar’s chat tonight. The House
        talks first. Games show up in the conversation, not a second app.
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

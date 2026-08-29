import { PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "Three questions.",
    body: "Same set for everyone here today. Correct answers and speed set your rank.",
  },
  {
    title: "See how you rank.",
    body: "That’s the game. Rank is for this place, today.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-4xl sm:text-5xl">How it works</h1>
      <ol className="mt-8 space-y-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-3xl border border-ink/10 bg-pad/70 px-5 py-5 shadow-[0_12px_32px_rgba(26,18,11,0.06)]"
          >
            <p className="font-condensed text-sm tracking-[0.22em] text-honey-deep">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 font-display text-2xl">{step.title}</p>
            <p className="mt-2 text-lg text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 max-w-xl space-y-3 text-lg text-ink-soft">
        <p>No account to play. About 30 seconds.</p>
      </div>
    </PublicShell>
  );
}

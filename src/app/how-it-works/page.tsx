import { PublicShell } from "@/components/public/PublicShell";

const STEPS = [
  {
    title: "Scan the paw.",
    body: "A printed mark at the venue. No app install.",
  },
  {
    title: "Play today’s BearGo.",
    body: "Same short game at every venue today. About a minute. No account.",
  },
  {
    title: "See your result.",
    body: "That’s the game. If a nearby offer is worth it, you’ll see it on the same screen.",
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
        <p>You can claim a nearby offer for free. Confirm email. Visit. Show the voucher.</p>
        <p className="font-semibold text-ink">You pay $0.</p>
      </div>
    </PublicShell>
  );
}

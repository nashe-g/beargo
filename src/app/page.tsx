import Link from "next/link";
import { HomePawSign } from "@/components/public/HomePawSign";
import { PublicShell } from "@/components/public/PublicShell";

const BEATS = [
  {
    n: "01",
    title: "Scan the paw.",
    body: "A printed mark on the table. Camera only. No app to install.",
  },
  {
    n: "02",
    title: "Don’t drop the drinks.",
    body: "The stack leans on its own. Tap the side it’s falling toward. Three carries — 3, 4, then 5 glasses.",
  },
  {
    n: "03",
    title: "Beat the room.",
    body: "3 curious questions. Same ones tonight. Then a name on the board.",
  },
  {
    n: "04",
    title: "Your rank.",
    body: "One run a night.",
  },
];

export default function Home() {
  return (
    <PublicShell>
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <div>
          <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
            A NIGHTLY CHALLENGE AT REAL PLACES
          </p>
          <h1 className="mt-4 max-w-xl font-display text-[2.4rem] leading-[1.06] tracking-tight sm:text-6xl">
            Scan the paw. Don’t drop the drinks.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft sm:text-xl">
            You’re carrying a leaning stack of pints through a crowded bar.
            Tap the side it’s falling toward. Then beat the crowd in today’s
            trivia. No account. Rank is this room, tonight.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/p/demo"
              className="btn-honey flex h-14 items-center justify-center rounded-full bg-honey px-8 text-lg font-semibold text-ink"
            >
              Play the demo
            </Link>
            <Link
              href="/how-it-works"
              className="flex h-14 items-center justify-center rounded-full border border-ink/15 bg-pad/70 px-8 text-ink transition-colors hover:bg-pad"
            >
              How it works
            </Link>
          </div>
        </div>
        <HomePawSign />
      </section>

      <section className="mt-20 border-t border-ink/10 pt-14 sm:mt-24">
        <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
          THE GAME
        </p>
        <h2 className="mt-3 max-w-lg font-display text-3xl tracking-tight sm:text-4xl">
          Rank is for this room, tonight.
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {BEATS.map((beat) => (
            <li
              key={beat.n}
              className="rounded-[1.6rem] border border-ink/10 bg-pad/65 px-5 py-6 shadow-[0_16px_36px_rgba(26,18,11,0.05)]"
            >
              <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
                {beat.n}
              </p>
              <p className="mt-3 font-display text-2xl leading-tight">
                {beat.title}
              </p>
              <p className="mt-3 leading-relaxed text-ink-soft">{beat.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-paper sm:mt-20 sm:px-10 sm:py-12">
        <p className="font-condensed text-sm tracking-[0.22em] text-honey">
          FOR THE ROOM
        </p>
        <h2 className="mt-3 max-w-lg font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Put a Paw where people already pause.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-paper/70">
          Hosts keep the physical mark. The game is the product. Players rank
          at your venue for that night.
        </p>
        <Link
          href="/for-hosts"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-honey px-6 font-semibold text-ink"
        >
          Apply as a host
        </Link>
      </section>
    </PublicShell>
  );
}

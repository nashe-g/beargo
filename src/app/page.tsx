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
    title: "You’re in the room.",
    body: "A live chat for everyone here tonight. The House talks first.",
  },
  {
    n: "03",
    title: "Play from the chat.",
    body: "The House drops a dare. Carry a tray. Three questions. Hand the phone.",
  },
];

export default function Home() {
  return (
    <PublicShell>
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <div>
          <p className="font-condensed text-sm tracking-[0.22em] text-honey-ink">
            TONIGHT, AT THE BAR
          </p>
          <h1 className="mt-4 max-w-xl font-display text-[2.4rem] leading-[1.06] tracking-tight sm:text-6xl">
            Scan the paw. You’re in the room.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft sm:text-xl">
            Tonight is a chat for everyone here. The House talks first. Games
            show up in the conversation. No account.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/p/demo?from=web"
              className="btn-honey flex h-14 items-center justify-center rounded-full bg-honey px-8 text-lg font-semibold text-ink"
            >
              Try the demo
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
          THE NIGHT
        </p>
        <h2 className="mt-3 max-w-lg font-display text-3xl tracking-tight sm:text-4xl">
          One paw. One room.
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
          Hosts keep the physical mark. The room talks. The House dares. Players
          are yours for that night.
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

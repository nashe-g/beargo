import { HostShell } from "@/components/host/HostShell";
import { requireHost } from "@/lib/host-auth";
import { getTodayPlay } from "@/lib/play-session";

export const dynamic = "force-dynamic";

export default async function HostChallengesPage() {
  const host = await requireHost();
  const play = await getTodayPlay();

  return (
    <HostShell host={host} current="/host/challenges">
      <h1 className="font-display text-4xl">Today’s BearGo</h1>
      <p className="mt-3 text-ink-soft">
        {play.localDate}. {play.body.format}. Same game at every venue today.
        You can look — you can’t change it.
      </p>
      <h2 className="mt-8 font-display text-3xl">{play.body.title}</h2>
      {play.body.hook ? <p className="mt-2 text-ink-soft">{play.body.hook}</p> : null}

      <ol className="mt-8 space-y-6">
        {play.body.interactions.map((item, index) => (
          <li
            key={item.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="text-sm tracking-[0.16em] uppercase text-ink-soft">
              {index + 1} / {play.body.interactions.length}
            </p>
            <h2 className="mt-2 font-display text-2xl">{item.prompt}</h2>
            {item.choices?.length ? (
              <ul className="mt-4 space-y-2">
                {item.choices.map((choice) => {
                  const correct =
                    play.body.format === "Quick Trivia" && choice.id === item.correctId;
                  return (
                    <li
                      key={choice.id}
                      className={`rounded-2xl px-4 py-3 ${
                        correct ? "bg-ink text-paper" : "bg-paper-deep"
                      }`}
                    >
                      {choice.label}
                      {correct ? " · correct" : ""}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </HostShell>
  );
}

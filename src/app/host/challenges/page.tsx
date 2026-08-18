import { HostShell } from "@/components/host/HostShell";
import { getDailyChallenge } from "@/lib/daily-challenge";
import { requireHost } from "@/lib/host-auth";

export const dynamic = "force-dynamic";

export default async function HostChallengesPage() {
  const host = await requireHost();
  const challenge = await getDailyChallenge(host.id, host.timezone);

  return (
    <HostShell host={host} current="/host/challenges">
      <h1 className="font-display text-4xl">Today’s challenge</h1>
      <p className="mt-3 text-ink-soft">
        {challenge.localDate}. Same three questions for every player here
        today. A new set tomorrow. You can look — you can’t change the live
        answers.
      </p>

      <ol className="mt-8 space-y-6">
        {challenge.questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-3xl border border-ink/10 px-5 py-5"
          >
            <p className="text-sm tracking-[0.16em] uppercase text-ink-soft">
              Question {index + 1} · {question.difficulty}
            </p>
            <h2 className="mt-2 font-display text-2xl">{question.prompt}</h2>
            <ul className="mt-4 space-y-2">
              {question.choices.map((choice) => {
                const correct = choice.id === question.correctId;
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
          </li>
        ))}
      </ol>
    </HostShell>
  );
}

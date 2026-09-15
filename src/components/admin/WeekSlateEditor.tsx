"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chunkNightPacks, isFullNightSlate } from "@/lib/question-packs";
import type { DaySlate } from "@/lib/question-slate-store";
import type { Question } from "@/lib/questions";

function dayBadge(day: DaySlate) {
  if (day.status === "published" && isFullNightSlate(day.questions)) {
    return "Published · 21";
  }
  if (day.status === "draft" && isFullNightSlate(day.questions)) {
    return "Draft · 21";
  }
  if (day.questions.length) {
    return `Old ${day.questions.length} — not a night`;
  }
  return "Empty";
}

export function WeekSlateEditor({
  days,
  configured,
}: {
  days: DaySlate[];
  configured: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"generate" | "publish" | "clear" | string | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Question[]>>({});

  useEffect(() => {
    setDrafts(
      Object.fromEntries(days.map((day) => [day.localDate, day.questions])),
    );
  }, [days]);

  const fillableCount = days.filter(
    (day) => !isFullNightSlate(day.questions),
  ).length;
  const draftCount = days.filter(
    (day) => day.status === "draft" && isFullNightSlate(day.questions),
  ).length;

  async function generate() {
    setBusy("generate");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/questions/week/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const payload = (await response.json()) as {
        error?: string;
        created?: string[];
        failed?: string[];
        failedErrors?: { localDate: string; errors: string[] }[];
        message?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Generation failed.");
      } else if (payload.message) {
        setMessage(payload.message);
      } else {
        const created = payload.created?.length ?? 0;
        const failed = payload.failed?.length ?? 0;
        const detail = payload.failedErrors
          ?.map((row) => `${row.localDate}: ${row.errors.join(" ")}`)
          .join(" ");
        setMessage(
          failed
            ? `Drafted ${created} day${created === 1 ? "" : "s"}. ${failed} still need a retry.${detail ? ` ${detail}` : ""}`
            : `Drafted ${created} day${created === 1 ? "" : "s"} · 21 questions each. Review, then publish.`,
        );
        router.refresh();
      }
    } catch {
      setError("Generation failed.");
    }
    setBusy(null);
  }

  async function save(localDate: string) {
    setBusy(`save:${localDate}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/questions/week/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localDate, questions: drafts[localDate] ?? [] }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Save failed.");
      } else {
        setMessage("Draft saved.");
        router.refresh();
      }
    } catch {
      setError("Save failed.");
    }
    setBusy(null);
  }

  async function publish(localDate?: string) {
    setBusy(localDate ? `publish:${localDate}` : "publish");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/questions/week/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localDate ? { localDate } : {}),
      });
      const payload = (await response.json()) as {
        error?: string;
        published?: string[];
      };
      if (!response.ok) {
        setError(payload.error ?? "Publish failed.");
      } else {
        const count = payload.published?.length ?? 0;
        setMessage(
          `Published ${count} day${count === 1 ? "" : "s"}. Every host gets these 21 questions.`,
        );
        router.refresh();
      }
    } catch {
      setError("Publish failed.");
    }
    setBusy(null);
  }

  async function clearCalendar() {
    if (
      !window.confirm(
        "Delete every generated night on this calendar? Tables already playing keep their questions. Then generate two fresh 21-question nights.",
      )
    ) {
      return;
    }
    setBusy("clear");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/questions/week/clear", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not clear the calendar.");
      } else {
        setMessage("Calendar cleared. Generate the next two nights.");
        router.refresh();
      }
    } catch {
      setError("Could not clear the calendar.");
    }
    setBusy(null);
  }

  function updateQuestion(
    localDate: string,
    index: number,
    patch: Partial<Question>,
  ) {
    setDrafts((current) => {
      const questions = [...(current[localDate] ?? [])];
      questions[index] = { ...questions[index], ...patch };
      return { ...current, [localDate]: questions };
    });
  }

  function updateChoice(
    localDate: string,
    questionIndex: number,
    choiceId: string,
    label: string,
  ) {
    setDrafts((current) => {
      const questions = [...(current[localDate] ?? [])];
      const question = questions[questionIndex];
      questions[questionIndex] = {
        ...question,
        choices: question.choices.map((choice) =>
          choice.id === choiceId ? { ...choice, label } : choice,
        ),
      };
      return { ...current, [localDate]: questions };
    });
  }

  const rangeLabel = useMemo(() => {
    if (days.length === 0) return "";
    return `${days[0].label} – ${days[days.length - 1].label}`;
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-ink/10 px-6 py-6">
        <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
          Next 7 days
        </p>
        <h2 className="mt-1 font-display text-3xl">{rangeLabel}</h2>
        <p className="mt-2 text-ink-soft">
          Each night is seven packs of three — 21 questions, same slate at every
          host. Generate writes the next two nights that are not a full 21.
          Publish makes them live. Old three-question days do not count.
        </p>
        {!configured ? (
          <p className="mt-4 text-clay">
            Add OPENAI_API_KEY to generate the next two nights.
          </p>
        ) : null}
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note: more drinks, fewer sports…"
          className="mt-4 min-h-24 w-full rounded-2xl border border-ink/15 px-4 py-3"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={Boolean(busy) || !configured || fillableCount === 0}
            onClick={generate}
            className="h-12 rounded-full bg-ink px-6 text-paper disabled:opacity-40"
          >
            {busy === "generate" ? "Generating…" : "Generate next 2 nights"}
          </button>
          <button
            type="button"
            disabled={Boolean(busy) || draftCount === 0}
            onClick={() => publish()}
            className="h-12 rounded-full border border-ink/20 px-6 disabled:opacity-40"
          >
            {busy === "publish" ? "Publishing…" : "Publish drafts"}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={clearCalendar}
            className="h-12 rounded-full border border-ink/20 px-6 disabled:opacity-40"
          >
            {busy === "clear" ? "Clearing…" : "Clear calendar"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
        {error ? <p className="mt-3 text-clay">{error}</p> : null}
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const questions = drafts[day.localDate] ?? [];
          const locked = day.status === "published" && isFullNightSlate(questions);
          const packs = chunkNightPacks(questions);
          const full = isFullNightSlate(questions);
          return (
            <section
              key={day.localDate}
              className="rounded-3xl border border-ink/10 px-6 py-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">{day.label}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{day.localDate}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    locked ? "bg-moss text-paper" : "bg-ink/10 text-ink-soft"
                  }`}
                >
                  {dayBadge({ ...day, questions })}
                </span>
              </div>

              {questions.length === 0 ? (
                <p className="mt-5 text-ink-soft">
                  Empty. Generate the next two nights to write 21 questions.
                </p>
              ) : (
                <div className="mt-5 space-y-8">
                  {packs.map((pack, packIndex) => (
                    <div key={`${day.localDate}-pack-${packIndex}`}>
                      <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                        Pack {packIndex + 1} of 7
                      </p>
                      <ol className="mt-3 grid gap-4 lg:grid-cols-3">
                        {pack.map((question, packOffset) => {
                          const index = packIndex * 3 + packOffset;
                          return (
                            <li key={question.id || `${day.localDate}-${index}`}>
                              <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                                {question.difficulty}
                              </p>
                              {locked ? (
                                <>
                                  <p className="mt-2">{question.prompt}</p>
                                  <p className="mt-2 text-sm text-moss">
                                    {
                                      question.choices.find(
                                        (choice) =>
                                          choice.id === question.correctId,
                                      )?.label
                                    }
                                  </p>
                                </>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={question.prompt}
                                    onChange={(event) =>
                                      updateQuestion(day.localDate, index, {
                                        prompt: event.target.value,
                                      })
                                    }
                                    className="min-h-24 w-full rounded-2xl border border-ink/15 px-3 py-2 text-sm"
                                  />
                                  {question.choices.map((choice) => (
                                    <label
                                      key={choice.id}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <input
                                        type="radio"
                                        name={`${day.localDate}-${question.id}-correct`}
                                        checked={question.correctId === choice.id}
                                        onChange={() =>
                                          updateQuestion(day.localDate, index, {
                                            correctId: choice.id,
                                          })
                                        }
                                      />
                                      <span className="w-4 font-mono text-ink-soft">
                                        {choice.id.toUpperCase()}
                                      </span>
                                      <input
                                        value={choice.label}
                                        onChange={(event) =>
                                          updateChoice(
                                            day.localDate,
                                            index,
                                            choice.id,
                                            event.target.value,
                                          )
                                        }
                                        className="h-10 flex-1 rounded-xl border border-ink/15 px-3"
                                      />
                                    </label>
                                  ))}
                                  <textarea
                                    value={question.explanation}
                                    onChange={(event) =>
                                      updateQuestion(day.localDate, index, {
                                        explanation: event.target.value,
                                      })
                                    }
                                    className="min-h-16 w-full rounded-2xl border border-ink/15 px-3 py-2 text-sm text-ink-soft"
                                  />
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  ))}
                </div>
              )}

              {day.status === "draft" && full ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => save(day.localDate)}
                    className="h-11 rounded-full border border-ink/20 px-5 disabled:opacity-40"
                  >
                    {busy === `save:${day.localDate}` ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => publish(day.localDate)}
                    className="h-11 rounded-full bg-ink px-5 text-paper disabled:opacity-40"
                  >
                    {busy === `publish:${day.localDate}`
                      ? "Publishing…"
                      : "Publish this night"}
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

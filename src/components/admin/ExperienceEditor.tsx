"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExperiencePreview } from "@/components/admin/ExperiencePreview";
import type { ExperienceBody, ExperienceRecord, InspirationSeed } from "@/lib/experience";

export function ExperienceEditor({
  experience: initial,
  seed,
  configured,
}: {
  experience: ExperienceRecord;
  seed: InspirationSeed | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState<ExperienceBody>(initial.body);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function updateInteraction(
    index: number,
    patch: Partial<ExperienceBody["interactions"][number]>,
  ) {
    setBody((current) => ({
      ...current,
      interactions: current.interactions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  async function save() {
    setBusy("save");
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/admin/experiences/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, body }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Save failed.");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Save failed.");
    }
    setBusy("");
  }

  async function generate() {
    setBusy("generate");
    setError("");
    try {
      const response = await fetch(
        `/api/admin/experiences/${initial.id}/generate`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        error?: string;
        experience?: ExperienceRecord;
      };
      if (!response.ok || !payload.experience) {
        setError(payload.error ?? "Generate failed.");
      } else {
        setBody(payload.experience.body);
        router.refresh();
      }
    } catch {
      setError("Generate failed.");
    }
    setBusy("");
  }

  return (
    <div className="space-y-8">
      {seed ? (
        <section className="rounded-3xl border border-ink/10 px-6 py-5">
          <p className="text-sm text-ink-soft">
            {seed.id} · {seed.beargo_primary_format} · text only
            {seed.copyright_asset_risk === "high"
              ? " · inspired (source was image-heavy)"
              : ""}
          </p>
          <p className="mt-2 font-display text-2xl">{seed.source_title}</p>
          <p className="mt-2 text-ink-soft">{seed.original_beargo_inspiration}</p>
          {seed.source_url ? (
            <a
              href={seed.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm underline-offset-2 hover:underline"
            >
              Open source
            </a>
          ) : null}
        </section>
      ) : null}

      <label className="block">
        <span className="text-sm text-ink-soft">Title</span>
        <input
          value={body.title}
          onChange={(event) => setBody({ ...body, title: event.target.value })}
          className="mt-2 h-12 w-full rounded-2xl border border-ink/15 px-4"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-soft">Hook</span>
        <input
          value={body.hook}
          onChange={(event) => setBody({ ...body, hook: event.target.value })}
          className="mt-2 h-12 w-full rounded-2xl border border-ink/15 px-4"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-soft">Note to the model</span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-ink/15 px-4"
        />
      </label>

      <section className="rounded-3xl border border-ink/10 px-6 py-6">
        <h2 className="font-display text-2xl">Payoff</h2>
        <input
          value={body.payoff.headline}
          onChange={(event) =>
            setBody({
              ...body,
              payoff: { ...body.payoff, headline: event.target.value },
            })
          }
          placeholder="Headline"
          className="mt-4 h-12 w-full rounded-2xl border border-ink/15 px-4"
        />
        <textarea
          value={body.payoff.body}
          onChange={(event) =>
            setBody({
              ...body,
              payoff: { ...body.payoff, body: event.target.value },
            })
          }
          placeholder="Body"
          className="mt-3 min-h-24 w-full rounded-2xl border border-ink/15 px-4 py-3"
        />
        <input
          value={body.payoff.template ?? ""}
          onChange={(event) =>
            setBody({
              ...body,
              payoff: { ...body.payoff, template: event.target.value },
            })
          }
          placeholder="Artifact template, e.g. {0} {1} Special"
          className="mt-3 h-12 w-full rounded-2xl border border-ink/15 px-4"
        />
        {(body.payoff.labels ?? []).map((label, labelIndex) => (
          <div key={label.id || labelIndex} className="mt-3 grid gap-2 sm:grid-cols-3">
            <input
              value={label.id}
              onChange={(event) =>
                setBody({
                  ...body,
                  payoff: {
                    ...body.payoff,
                    labels: (body.payoff.labels ?? []).map((entry, index) =>
                      index === labelIndex ? { ...entry, id: event.target.value } : entry,
                    ),
                  },
                })
              }
              placeholder="id / tag"
              className="h-11 rounded-2xl border border-ink/15 px-3"
            />
            <input
              value={label.title}
              onChange={(event) =>
                setBody({
                  ...body,
                  payoff: {
                    ...body.payoff,
                    labels: (body.payoff.labels ?? []).map((entry, index) =>
                      index === labelIndex ? { ...entry, title: event.target.value } : entry,
                    ),
                  },
                })
              }
              placeholder="Result title"
              className="h-11 rounded-2xl border border-ink/15 px-3"
            />
            <input
              value={label.body}
              onChange={(event) =>
                setBody({
                  ...body,
                  payoff: {
                    ...body.payoff,
                    labels: (body.payoff.labels ?? []).map((entry, index) =>
                      index === labelIndex ? { ...entry, body: event.target.value } : entry,
                    ),
                  },
                })
              }
              placeholder="Result body"
              className="h-11 rounded-2xl border border-ink/15 px-3"
            />
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl">Interactions</h2>
        {body.interactions.length === 0 ? (
          <p className="mt-3 text-ink-soft">Generate a draft to fill this.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {body.interactions.map((item, index) => (
              <li key={item.id} className="rounded-3xl border border-ink/10 px-5 py-5">
                <p className="text-sm text-ink-soft">
                  {index + 1} / {body.interactions.length}
                </p>
                <textarea
                  value={item.prompt}
                  onChange={(event) =>
                    updateInteraction(index, { prompt: event.target.value })
                  }
                  className="mt-2 min-h-20 w-full rounded-2xl border border-ink/15 px-4 py-3"
                />
                {(item.choices ?? []).map((choice) => (
                  <label key={choice.id} className="mt-2 flex items-center gap-2">
                    <span className="w-6 text-sm uppercase text-ink-soft">
                      {choice.id}
                    </span>
                    <input
                      value={choice.label}
                      onChange={(event) =>
                        updateInteraction(index, {
                          choices: (item.choices ?? []).map((entry) =>
                            entry.id === choice.id
                              ? { ...entry, label: event.target.value }
                              : entry,
                          ),
                        })
                      }
                      className="h-11 flex-1 rounded-2xl border border-ink/15 px-3"
                    />
                    <input
                      value={choice.tag ?? ""}
                      onChange={(event) =>
                        updateInteraction(index, {
                          choices: (item.choices ?? []).map((entry) =>
                            entry.id === choice.id
                              ? { ...entry, tag: event.target.value }
                              : entry,
                          ),
                        })
                      }
                      placeholder="tag"
                      className="h-11 w-24 rounded-2xl border border-ink/15 px-3 text-sm"
                    />
                    {item.correctId === choice.id ? (
                      <span className="text-sm text-moss">correct</span>
                    ) : null}
                  </label>
                ))}
                <textarea
                  value={item.explanation ?? ""}
                  onChange={(event) =>
                    updateInteraction(index, { explanation: event.target.value })
                  }
                  placeholder="Explanation"
                  className="mt-3 min-h-16 w-full rounded-2xl border border-ink/15 px-4 py-3 text-sm"
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {body.warnings.length > 0 ? (
        <ul className="text-sm text-honey-deep">
          {body.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={save}
          className="h-12 rounded-full bg-ink px-6 text-paper disabled:opacity-40"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || !configured}
          onClick={generate}
          className="h-12 rounded-full border border-ink/20 px-6 disabled:opacity-40"
        >
          {busy === "generate" ? "Generating…" : "Generate draft"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || body.interactions.length < 1}
          onClick={() => setPreviewOpen(true)}
          className="h-12 rounded-full border border-ink/20 px-6 disabled:opacity-40"
        >
          Preview on phone
        </button>
      </div>
      {saved ? <p className="text-sm text-ink-soft">Saved.</p> : null}
      {error ? <p className="text-clay">{error}</p> : null}
      <ExperiencePreview
        body={body}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

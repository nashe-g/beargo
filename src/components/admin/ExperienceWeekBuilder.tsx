"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LIVE_FORMATS,
  adaptationModeForSeed,
  flattenSeedForProduct,
  weekDiversityWarnings,
  type AdaptationMode,
  type ExperienceRecord,
  type InspirationSeed,
} from "@/lib/experience";

const WEEK_STORAGE_KEY = "beargo:admin:week-slots";

type Slot = {
  seed: InspirationSeed;
  adaptationMode: AdaptationMode;
  notes: string;
  experience?: ExperienceRecord;
};

type StoredSlot = {
  seedId: string;
  adaptationMode: AdaptationMode;
  notes: string;
  experienceId?: string;
};

function readStoredSlots(): StoredSlot[] {
  try {
    const raw = sessionStorage.getItem(WEEK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSlot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredSlots(slots: Slot[]) {
  const payload: StoredSlot[] = slots.map((slot) => ({
    seedId: slot.seed.id,
    adaptationMode: slot.adaptationMode,
    notes: slot.notes,
    experienceId: slot.experience?.id,
  }));
  sessionStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(payload));
}

export function ExperienceWeekBuilder({
  library,
  configured,
}: {
  library: InspirationSeed[];
  configured: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("");
  const [paste, setPaste] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const readySlots = slots ?? [];

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const stored = readStoredSlots();
      if (stored.length === 0) {
        if (!cancelled) setSlots([]);
        return;
      }
      const next: Slot[] = [];
      for (const row of stored) {
        const seed = library.find((item) => item.id === row.seedId);
        if (!seed) continue;
        let experience: ExperienceRecord | undefined;
        if (row.experienceId) {
          try {
            const response = await fetch(
              `/api/admin/experiences/${row.experienceId}`,
            );
            if (response.ok) {
              const payload = (await response.json()) as {
                experience?: ExperienceRecord;
              };
              experience = payload.experience;
            }
          } catch {
            /* keep seed slot even if draft fetch fails */
          }
        }
        next.push({
          seed: flattenSeedForProduct(seed),
          adaptationMode: adaptationModeForSeed(seed, row.adaptationMode),
          notes: row.notes ?? "",
          experience,
        });
      }
      if (!cancelled) {
        setSlots(next);
        if (next.length > 0) {
          setMessage(
            `Restored ${next.length} day${next.length === 1 ? "" : "s"} from this browser session.`,
          );
        }
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [library]);

  useEffect(() => {
    if (slots === null) return;
    writeStoredSlots(slots);
  }, [slots]);

  const selectedIds = useMemo(
    () => new Set(readySlots.map((slot) => slot.seed.id)),
    [readySlots],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter((seed) => {
      if (format && seed.beargo_primary_format !== format) return false;
      if (!q) return true;
      const blob = [
        seed.id,
        seed.source_title,
        seed.original_beargo_inspiration,
        (seed.themes ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [library, query, format]);

  const warnings = weekDiversityWarnings(
    readySlots.map((slot) => slot.seed.beargo_primary_format),
  );

  function addSeed(seed: InspirationSeed) {
    setError("");
    setMessage("");
    const flat = flattenSeedForProduct(seed);
    setSlots((current) => {
      const list = current ?? [];
      if (list.some((slot) => slot.seed.id === flat.id)) return list;
      if (list.length >= 7) {
        setError("A week is 7 seeds.");
        return list;
      }
      setMessage(`Added ${flat.id} as day ${list.length + 1}.`);
      return [
        ...list,
        {
          seed: flat,
          adaptationMode: adaptationModeForSeed(flat, "inspired"),
          notes: "",
        },
      ];
    });
  }

  function applyPaste() {
    setError("");
    setMessage("");
    try {
      const parsed = JSON.parse(paste) as InspirationSeed | InspirationSeed[];
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length < 1 || rows.length > 7) {
        setError("Paste 1 to 7 seed JSON objects.");
        return;
      }
      setSlots(
        rows.map((seed) => {
          const flat = flattenSeedForProduct(seed);
          return {
            seed: flat,
            adaptationMode: adaptationModeForSeed(flat, "inspired"),
            notes: "",
          };
        }),
      );
      setMessage(
        `Loaded ${rows.length} seed${rows.length === 1 ? "" : "s"} from paste.`,
      );
    } catch {
      setError("That paste was not valid JSON.");
    }
  }

  async function createDrafts() {
    setBusy("drafts");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/experiences/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: readySlots.map((slot) => ({
            seedId: slot.seed.id,
            seed: slot.seed,
            adaptationMode: slot.adaptationMode,
            notes: slot.notes,
          })),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        experiences?: ExperienceRecord[];
      };
      if (!response.ok || !payload.experiences) {
        setError(payload.error ?? "Could not create drafts.");
      } else {
        setSlots((current) =>
          (current ?? []).map((slot, index) => ({
            ...slot,
            experience: payload.experiences?.[index],
          })),
        );
        setMessage(
          "Drafts saved. Click Generate, then Edit for phone preview. Back won’t lose this week.",
        );
      }
    } catch {
      setError("Could not create drafts.");
    }
    setBusy("");
  }

  async function generateOne(index: number) {
    const slot = readySlots[index];
    if (!slot?.experience) return;
    setBusy(`gen-${slot.experience.id}`);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/experiences/${slot.experience.id}/generate`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        error?: string;
        experience?: ExperienceRecord;
      };
      if (!response.ok || !payload.experience) {
        setError(payload.error ?? "Generate failed.");
      } else {
        setSlots((current) =>
          (current ?? []).map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, experience: payload.experience }
              : item,
          ),
        );
      }
    } catch {
      setError("Generate failed.");
    }
    setBusy("");
  }

  async function generateAll() {
    setBusy("generate-all");
    setError("");
    for (const [index, slot] of readySlots.entries()) {
      if (!slot.experience) continue;
      setBusy(`gen-${slot.experience.id}`);
      try {
        const response = await fetch(
          `/api/admin/experiences/${slot.experience.id}/generate`,
          { method: "POST" },
        );
        const payload = (await response.json()) as {
          error?: string;
          experience?: ExperienceRecord;
        };
        if (!response.ok || !payload.experience) {
          setError(payload.error ?? `Generate failed on day ${index + 1}.`);
          setBusy("");
          return;
        }
        setSlots((current) =>
          (current ?? []).map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, experience: payload.experience }
              : item,
          ),
        );
      } catch {
        setError(`Generate failed on day ${index + 1}.`);
        setBusy("");
        return;
      }
    }
    setBusy("");
    setMessage("All days generated. Open Edit for phone preview.");
  }

  async function publish() {
    setBusy("publish");
    setError("");
    setMessage("");
    const ids = readySlots
      .map((slot) => slot.experience?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length !== readySlots.length) {
      setError("Create drafts first.");
      setBusy("");
      return;
    }
    try {
      const response = await fetch("/api/admin/experiences/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceIds: ids }),
      });
      const payload = (await response.json()) as {
        error?: string;
        blockers?: string[];
      };
      if (!response.ok) {
        setError(
          payload.blockers?.join(" ") || payload.error || "Publish failed.",
        );
      } else {
        sessionStorage.removeItem(WEEK_STORAGE_KEY);
        setMessage("Published. Day 1 is live.");
        router.push("/admin/experiences");
        router.refresh();
      }
    } catch {
      setError("Publish failed.");
    }
    setBusy("");
  }

  if (slots === null) {
    return <p className="text-ink-soft">Loading this week…</p>;
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-honey/40 bg-honey/10 px-6 py-6">
        <h2 className="font-display text-2xl">This week</h2>
        <p className="mt-2 text-ink-soft">
          {readySlots.length} / 7 days. Order: Add → Create drafts → Generate →
          Edit (phone preview) → Publish.
        </p>
        {warnings.map((warning) => (
          <p key={warning} className="mt-2 text-sm text-honey-deep">
            {warning}
          </p>
        ))}
        {message ? <p className="mt-2 text-sm text-moss">{message}</p> : null}
        {error ? <p className="mt-2 text-clay">{error}</p> : null}
        {readySlots.length === 0 ? (
          <p className="mt-4 text-ink-soft">
            Nothing selected yet. Click Add on a library seed. Drafts already
            created also appear under Experiences → Recent drafts.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {readySlots.map((slot, index) => (
              <li
                key={slot.seed.id}
                className="rounded-3xl border border-ink/10 bg-paper px-5 py-5"
              >
                <p className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                  Day {index + 1}
                  {index === 0 ? " · live on publish" : ""}
                </p>
                <p className="mt-2 font-display text-2xl">
                  {slot.experience?.title || slot.seed.source_title}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {slot.seed.id} · {slot.seed.beargo_primary_format}
                  {slot.experience
                    ? ` · ${slot.experience.body.interactions.length} interactions · ${slot.experience.status}`
                    : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <select
                    value={slot.adaptationMode}
                    onChange={(event) =>
                      setSlots((current) =>
                        (current ?? []).map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                adaptationMode: adaptationModeForSeed(
                                  item.seed,
                                  event.target.value as AdaptationMode,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                    className="h-11 rounded-full border border-ink/15 px-4"
                  >
                    <option value="inspired">inspired</option>
                    {slot.seed.copyright_asset_risk === "high" ? null : (
                      <option value="near_adopt">near_adopt</option>
                    )}
                  </select>
                  <input
                    value={slot.notes}
                    onChange={(event) =>
                      setSlots((current) =>
                        (current ?? []).map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, notes: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Note to the model"
                    className="h-11 min-w-48 flex-1 rounded-full border border-ink/15 px-4"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSlots((current) =>
                        (current ?? []).filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      );
                      setMessage("");
                    }}
                    className="h-11 rounded-full border border-ink/20 px-4 text-sm"
                  >
                    Remove
                  </button>
                  {slot.experience ? (
                    <>
                      <button
                        type="button"
                        disabled={Boolean(busy) || !configured}
                        onClick={() => generateOne(index)}
                        className="h-11 rounded-full bg-ink px-4 text-sm text-paper disabled:opacity-40"
                      >
                        {busy === `gen-${slot.experience.id}`
                          ? "Generating…"
                          : "Generate"}
                      </button>
                      <Link
                        href={`/admin/experiences/${slot.experience.id}`}
                        className="flex h-11 items-center rounded-full border border-ink/20 px-4 text-sm"
                      >
                        Edit
                      </Link>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={Boolean(busy) || readySlots.length === 0}
            onClick={createDrafts}
            className="h-12 rounded-full bg-ink px-5 text-paper disabled:opacity-40"
          >
            {busy === "drafts" ? "Creating…" : "Create drafts"}
          </button>
          <button
            type="button"
            disabled={
              Boolean(busy) ||
              !configured ||
              readySlots.some((slot) => !slot.experience)
            }
            onClick={generateAll}
            className="h-12 rounded-full border border-ink/20 px-5 disabled:opacity-40"
          >
            {busy.startsWith("gen-") || busy === "generate-all"
              ? "Generating…"
              : "Generate all"}
          </button>
          <button
            type="button"
            disabled={
              Boolean(busy) ||
              readySlots.length === 0 ||
              readySlots.some((slot) => !slot.experience)
            }
            onClick={publish}
            className="h-12 rounded-full bg-honey px-5 font-semibold text-ink disabled:opacity-40"
          >
            {busy === "publish" ? "Publishing…" : "Publish week"}
          </button>
          {readySlots.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(WEEK_STORAGE_KEY);
                setSlots([]);
                setMessage("Cleared this week tray.");
              }}
              className="h-12 rounded-full border border-ink/20 px-5 text-sm"
            >
              Clear tray
            </button>
          ) : null}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Library</h2>
            <p className="mt-2 text-ink-soft">
              {library.length} inspiration seeds. Add puts the whole seed into
              this week — same fields as the JSONL, flattened to text-only.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, theme, id"
            className="h-11 min-w-56 flex-1 rounded-full border border-ink/15 px-4"
          />
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="h-11 rounded-full border border-ink/15 px-4"
          >
            <option value="">All formats</option>
            {LIVE_FORMATS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
          {filtered.slice(0, 120).map((seed) => {
            const added = selectedIds.has(seed.id);
            return (
              <li
                key={seed.id}
                className={`rounded-3xl border px-5 py-4 ${
                  added ? "border-moss/40 bg-moss/5" : "border-ink/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <p className="text-sm text-ink-soft">
                      {seed.id} · {seed.beargo_primary_format} ·{" "}
                      {seed.overall_beargo_score}
                    </p>
                    <p className="mt-1 font-display text-xl">
                      {seed.source_title}
                    </p>
                    <p className="mt-2 text-sm text-ink-soft">
                      {seed.original_beargo_inspiration}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={added || readySlots.length >= 7}
                    onClick={() => addSeed(seed)}
                    className={`h-10 rounded-full px-4 text-sm ${
                      added
                        ? "bg-moss text-paper"
                        : "bg-ink text-paper disabled:opacity-40"
                    }`}
                  >
                    {added ? "Added" : "Add"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-ink/10 px-6 py-6">
        <h2 className="font-display text-2xl">Paste JSON</h2>
        <p className="mt-2 text-ink-soft">
          Optional. An array of seed records from the JSONL. Same result as
          clicking Add.
        </p>
        <textarea
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-2xl border border-ink/15 px-4 py-3 font-mono text-sm"
          placeholder='[{ "id": "BF-000001", ... }]'
        />
        <button
          type="button"
          onClick={applyPaste}
          className="mt-4 h-11 rounded-full border border-ink/20 px-5"
        >
          Load paste
        </button>
      </section>
    </div>
  );
}

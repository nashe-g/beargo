"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROMOTION_CATEGORIES } from "@/lib/offer";

export function HostExclusionsForm({
  excludedCategories,
}: {
  excludedCategories: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(excludedCategories);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/host/exclusions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedCategories: selected }),
    });
    setMessage(response.ok ? "Saved." : "Could not save.");
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-3">
      {PROMOTION_CATEGORIES.map((category) => {
        const on = selected.includes(category.id);
        return (
          <label
            key={category.id}
            className={`flex min-h-12 items-center rounded-2xl border px-4 ${
              on ? "border-honey bg-honey/15" : "border-ink/10"
            }`}
          >
            <input
              type="checkbox"
              className="mr-3 accent-honey"
              checked={on}
              onChange={() =>
                setSelected((current) =>
                  on
                    ? current.filter((id) => id !== category.id)
                    : [...current, category.id],
                )
              }
            />
            Block {category.label.toLowerCase()}
          </label>
        );
      })}
      <button
        type="submit"
        className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-ink text-paper"
      >
        Save
      </button>
      {message ? <p className="text-ink-soft">{message}</p> : null}
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

export function CardMenu({
  label = "Actions",
  disabled,
  items,
}: {
  label?: string;
  disabled?: boolean;
  items: { label: string; onClick: () => void | Promise<void> }[];
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="absolute right-3 top-3" ref={menuRef}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-50"
      >
        <MenuIcon />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-10 min-w-[12rem] rounded-2xl border border-ink/10 bg-paper py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={async () => {
                setOpen(false);
                await item.onClick();
              }}
              className="flex w-full px-4 py-3 text-left text-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type Option = { value: string; label: string };

/**
 * Brand-styled dropdown replacing the native <select>.
 * Keyboard: ↑/↓ to move, Enter to choose, Esc to close, type to jump. Long lists get a search box.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  className = "",
  size = "md",
  searchable,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  options: (Option | string)[];
  placeholder?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  searchable?: boolean;
  align?: "left" | "right";
}) {
  const opts = useMemo(() => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)), [options]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [up, setUp] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const canSearch = searchable ?? opts.length > 12;
  const shown = useMemo(() => (q ? opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : opts), [opts, q]);
  const current = opts.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    // open upwards when there isn't room below
    const r = box.current!.getBoundingClientRect();
    setUp(window.innerHeight - r.bottom < 300 && r.top > 300);
    setHi(Math.max(0, shown.findIndex((o) => o.value === value)));
    return () => document.removeEventListener("pointerdown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setQ("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(shown.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[hi]) choose(shown[hi].value);
    } else if (!canSearch && e.key.length === 1) {
      const k = shown.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (k >= 0) setHi(k);
    }
  };

  const pad = size === "sm" ? "px-3 py-2 text-[13.5px]" : "px-4 py-3 text-[15px]";

  return (
    <div ref={box} className={`relative ${className}`} onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white text-left outline-none transition ${pad} ${open ? "border-maroon/50 ring-4 ring-maroon/10" : "border-line hover:border-ink/30"}`}
      >
        <span className={`truncate ${current ? "text-ink" : "text-muted/70"}`}>{current?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`absolute z-50 min-w-full overflow-hidden rounded-md border border-line bg-white shadow-[var(--shadow-pop)] animate-fade-up ${up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"} ${align === "right" ? "right-0" : "left-0"}`}
        >
          {canSearch && (
            <label className="flex items-center gap-2 border-b border-line px-3">
              <Search size={15} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => (setQ(e.target.value), setHi(0))}
                placeholder="Search…"
                className="h-10 w-full bg-transparent text-sm outline-none"
              />
            </label>
          )}
          <ul ref={list} id={id} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-4 py-2.5 text-sm text-muted">No matches</li>}
            {shown.map((o, k) => {
              const sel = o.value === value;
              return (
                <li
                  key={o.value}
                  data-i={k}
                  role="option"
                  aria-selected={sel}
                  onPointerEnter={() => setHi(k)}
                  onClick={() => choose(o.value)}
                  className={`flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-4 py-2.5 text-sm transition-colors ${k === hi ? "bg-sand" : ""} ${sel ? "font-semibold text-maroon" : "text-ink"}`}
                >
                  {o.label}
                  {sel && <Check size={15} className="shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

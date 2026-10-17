"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

/** Centred dialog with a dimmed backdrop. Esc / backdrop click close it unless `locked`. */
export function Modal({ open, onClose, title, subtitle, children, locked = false }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; locked?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => e.key === "Escape" && !locked && onClose();
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [open, onClose, locked]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => !locked && onClose()} />
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-[var(--shadow-pop)] animate-fade-up">
        {!locked && (
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-sand" aria-label="Close">
            <X size={18} />
          </button>
        )}
        <h2 className="h-display pr-6 text-[22px] font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

"use client";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/lib/store";

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-[var(--shadow-pop)] animate-fade-up"
        >
          {t.tone === "error" ? <XCircle size={17} className="text-red-300" /> : <CheckCircle2 size={17} className="text-emerald-300" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

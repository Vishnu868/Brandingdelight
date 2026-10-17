"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { formatINR, thumb } from "@/lib/format";
import type { ProductCard } from "@/lib/types";
import { startRouteLoading } from "@/components/RouteLoader";

export function SearchBox({ autoFocus, onNavigate }: { autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<ProductCard[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (r.ok) setRes((await r.json()).results);
      } catch {
        /* aborted */
      } finally {
        setBusy(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = () => {
    if (!q.trim()) return;
    setOpen(false);
    onNavigate?.();
    startRouteLoading();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={box} className="relative w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex items-center rounded-md border border-line bg-white pl-4 pr-1.5 transition focus-within:border-maroon/40 focus-within:ring-4 focus-within:ring-maroon/10"
      >
        <Search size={18} className="shrink-0 text-muted" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search hampers, copper bottles, air fryers, luggage…"
          className="h-11 w-full bg-transparent px-3 text-[15px] outline-none placeholder:text-muted/70"
          enterKeyHint="search"
          aria-label="Search products"
        />
        {busy && <Loader2 size={16} className="mr-2 animate-spin text-muted" />}
        <button type="submit" className="hidden rounded-md bg-maroon px-4 py-2 text-xs font-semibold text-white sm:block">
          Search
        </button>
      </form>
      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-line bg-white shadow-[var(--shadow-pop)] animate-fade-up">
          {res.length === 0 && !busy ? (
            <p className="p-4 text-sm text-muted">No matches for “{q}”. Try another word.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {res.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-cream"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(p.image)} alt="" className="size-12 shrink-0 rounded-lg bg-sand object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">{p.brand}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{p.price ? formatINR(p.price) : "On request"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {res.length > 0 && (
            <button onClick={go} className="w-full border-t border-line px-4 py-3 text-left text-sm font-semibold text-maroon hover:bg-cream">
              See all results for “{q.trim()}” →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

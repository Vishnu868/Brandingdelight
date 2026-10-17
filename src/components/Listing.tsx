"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard, gridCls } from "./ProductCard";
import { Select } from "./Select";
import { searchCards } from "@/lib/search";
import { unpackCards, type PackedCards } from "@/lib/pack";
import { slugify } from "@/lib/format";
import type { ProductCard as Card } from "@/lib/types";

const SORTS = [
  ["relevance", "Recommended"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["name", "Name A–Z"],
  ["new", "Newest"],
] as const;

const PRICE_BANDS = [
  ["0-500", "Under ₹500"],
  ["500-1000", "₹500 – ₹1,000"],
  ["1000-2500", "₹1,000 – ₹2,500"],
  ["2500-5000", "₹2,500 – ₹5,000"],
  ["5000-15000", "₹5,000 – ₹15,000"],
  ["15000-999999", "Above ₹15,000"],
] as const;

const PAGE = 24;

/** Client-side filtered listing. Cards arrive pre-rendered from the server; filtering happens instantly in the browser. */
export function Listing({ data, facetBy = "category" }: { data: PackedCards; facetBy?: "category" | "subcategory" }) {
  const cards = useMemo(() => unpackCards(data), [data]);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const q = sp.get("q") ?? "";
  const sort = sp.get("sort") ?? "relevance";
  const brands = sp.getAll("brand");
  const facets = sp.getAll(facetBy === "category" ? "cat" : "sub");
  const price = sp.get("price");
  const onlyPriced = sp.get("priced") === "1";

  const setParam = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    start(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  };
  const toggle = (key: string, val: string) =>
    setParam((p) => {
      const all = p.getAll(key);
      p.delete(key);
      (all.includes(val) ? all.filter((x) => x !== val) : [...all, val]).forEach((v) => p.append(key, v));
    });

  const base = useMemo(() => (q ? searchCards(cards, q) : cards), [cards, q]);

  const brandOpts = useMemo(() => count(base, (c) => c.brand), [base]);
  const facetOpts = useMemo(() => count(base, (c) => (facetBy === "category" ? c.category : c.subcategory)), [base, facetBy]);

  const list = useMemo(() => {
    let l = base;
    if (brands.length) l = l.filter((c) => brands.includes(slugify(c.brand)));
    if (facets.length) l = l.filter((c) => facets.includes(slugify(facetBy === "category" ? c.category : c.subcategory)));
    if (price) {
      const [a, b] = price.split("-").map(Number);
      l = l.filter((c) => c.price != null && c.price >= a && c.price < b);
    }
    if (onlyPriced) l = l.filter((c) => c.price != null && !c.priceOnRequest);
    const priceOf = (c: Card) => (c.price == null ? Infinity : c.price);
    if (sort === "price-asc") l = [...l].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") l = [...l].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else if (sort === "name") l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "new") l = [...l].reverse();
    return l;
  }, [base, brands, facets, price, onlyPriced, sort, facetBy]);

  useEffect(() => setLimit(PAGE), [list]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setLimit((n) => n + PAGE), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list]);

  const activeCount = brands.length + facets.length + (price ? 1 : 0) + (onlyPriced ? 1 : 0);

  const filters = (
    <div className="space-y-7">
      {facetOpts.length > 1 && (
        <FilterGroup title={facetBy === "category" ? "Category" : "Type"}>
          {facetOpts.map(([name, n]) => (
            <Check key={name} label={name} n={n} on={facets.includes(slugify(name))} onChange={() => toggle(facetBy === "category" ? "cat" : "sub", slugify(name))} />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Price">
        {PRICE_BANDS.map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
            <input type="radio" name="price" checked={price === v} onChange={() => setParam((p) => p.set("price", v))} className="accent-maroon" />
            {l}
          </label>
        ))}
        {price && (
          <button className="mt-1 text-xs font-semibold text-maroon" onClick={() => setParam((p) => p.delete("price"))}>
            Clear price
          </button>
        )}
      </FilterGroup>
      {brandOpts.length > 1 && (
        <FilterGroup title="Brand">
          {brandOpts.map(([name, n]) => (
            <Check key={name} label={name} n={n} on={brands.includes(slugify(name))} onChange={() => toggle("brand", slugify(name))} />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Availability">
        <Check label="Buy online now (hide quote-only)" on={onlyPriced} onChange={() => setParam((p) => (onlyPriced ? p.delete("priced") : p.set("priced", "1")))} />
      </FilterGroup>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-2">{filters}</div>
      </aside>
      <div>
        <div className="sticky top-16 z-20 -mx-4 mb-4 flex items-center gap-2 border-b border-line bg-cream/95 px-4 py-2.5 backdrop-blur sm:relative sm:z-30 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none lg:top-auto">
          <button onClick={() => setDrawer(true)} className="btn-outline !py-2 lg:hidden">
            <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <span className="rounded-md bg-maroon px-1.5 text-[11px] text-white">{activeCount}</span>}
          </button>
          <p className="hidden text-sm text-muted sm:block">
            {list.length} product{list.length === 1 ? "" : "s"}
            {q && (
              <>
                {" "}
                for “<span className="font-semibold text-ink">{q}</span>”
              </>
            )}
          </p>
          <Select
            value={sort}
            onChange={(v) => setParam((p) => p.set("sort", v))}
            options={SORTS.map(([value, label]) => ({ value, label }))}
            label="Sort products"
            size="sm"
            align="right"
            className="ml-auto w-[200px]"
          />
        </div>

        {activeCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {[...facets.map((f) => [facetBy === "category" ? "cat" : "sub", f]), ...brands.map((b) => ["brand", b])].map(([k, v]) => (
              <button key={k + v} onClick={() => toggle(k, v)} className="chip">
                {facetOpts.find(([n]) => slugify(n) === v)?.[0] ?? brandOpts.find(([n]) => slugify(n) === v)?.[0] ?? v} <X size={13} />
              </button>
            ))}
            <button className="text-xs font-semibold text-maroon" onClick={() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false })}>
              Clear all
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="h-display text-xl font-semibold">No products found</p>
            <p className="mt-2 text-sm text-muted">Try removing some filters or searching for something else.</p>
          </div>
        ) : (
          <div className={gridCls.replace("xl:grid-cols-5", "xl:grid-cols-4")}>
            {list.slice(0, limit).map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 4} />
            ))}
          </div>
        )}
        {limit < list.length && <div ref={sentinel} className="h-10" />}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-xl bg-cream animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-base font-semibold">Filters</p>
              <button onClick={() => setDrawer(false)} aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="border-t border-line p-4">
              <button className="btn-primary w-full" onClick={() => setDrawer(false)}>
                Show {list.length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function count(cards: Card[], key: (c: Card) => string) {
  const m = new Map<string, number>();
  for (const c of cards) {
    const k = key(c);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label !mb-3">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Check({ label, n, on, onChange }: { label: string; n?: number; on: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
      <input type="checkbox" checked={on} onChange={onChange} className="size-4 accent-maroon" />
      <span className="flex-1">{label}</span>
      {n != null && <span className="text-xs text-muted">{n}</span>}
    </label>
  );
}

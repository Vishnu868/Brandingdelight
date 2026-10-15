"use client";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { formatINR, thumb } from "@/lib/format";
import { useCart, useToast, useWishlist } from "@/lib/store";
import { useMounted } from "./Header";
import type { ProductCard as Card } from "@/lib/types";

/** Portrait catalogue flyers fill the tile; landscape / cut-out shots are shown whole. */
export const coverFit = (src: string) => /\/(fuzo|loyka|eo|bottles|dryfruits|smoor|unwrap|lifelong)\//.test(src);

export function ProductCard({ p, priority = false }: { p: Card; priority?: boolean }) {
  const mounted = useMounted();
  const wished = useWishlist((s) => s.items.some((i) => i.id === p.id));
  const toggle = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.push);
  const cover = coverFit(p.image);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
      <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-[#f6f1ea]" prefetch={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb(p.image)}
          alt={p.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`size-full transition duration-500 group-hover:scale-[1.04] ${cover ? "object-cover" : "object-contain p-1.5"}`}
        />
        {!p.inStock && !p.priceOnRequest && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger">Sold out</span>
        )}
        {p.priceOnRequest && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Bulk / Quote
          </span>
        )}
      </Link>
      <button
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => {
          toggle({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image, price: p.price });
          toast(wished ? "Removed from wishlist" : "Saved to wishlist");
        }}
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105"
      >
        <Heart size={17} className={mounted && wished ? "fill-maroon text-maroon" : "text-ink-soft"} />
      </button>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="truncate text-[10.5px] font-semibold uppercase tracking-wider text-gold">{p.brand}</p>
        <Link href={`/product/${p.slug}`} prefetch={false} className="mt-1 line-clamp-2 min-h-[2.6em] text-[13.5px] leading-snug text-ink sm:text-[14px]">
          {p.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          {p.price != null && !p.priceOnRequest ? (
            <p className="text-[15px] font-bold">
              {p.hasVariants && <span className="mr-1 text-[11px] font-medium text-muted">from</span>}
              {formatINR(p.price)}
            </p>
          ) : (
            <p className="text-[13px] font-semibold text-maroon">Price on request</p>
          )}
          {p.price != null && !p.priceOnRequest && !p.hasVariants && p.inStock && (
            <button
              aria-label="Add to cart"
              onClick={() => {
                add({ productId: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image, price: p.price! });
                toast("Added to cart");
              }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-maroon text-white transition hover:bg-maroon-dark active:scale-95"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-2.5 w-16" />
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton mt-3 h-4 w-20" />
      </div>
    </div>
  );
}

export const gridCls = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

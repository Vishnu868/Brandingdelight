"use client";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useMounted } from "@/components/Header";
import { formatINR, thumb } from "@/lib/format";
import { useCart, useToast, useWishlist } from "@/lib/store";

export default function WishlistPage() {
  const mounted = useMounted();
  const { items, remove } = useWishlist();
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.push);
  if (!mounted) return <div className="container-x py-10"><div className="skeleton h-64 w-full rounded-lg" /></div>;

  if (!items.length)
    return (
      <div className="container-x grid place-items-center py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-sand">
          <Heart size={34} className="text-maroon" />
        </span>
        <h1 className="h-display mt-5 text-3xl font-semibold">Your wishlist is empty</h1>
        <p className="mt-2 text-muted">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Explore products
        </Link>
      </div>
    );

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="h-display text-3xl font-semibold">Wishlist</h1>
      <p className="text-sm text-muted">{items.length} saved item{items.length > 1 ? "s" : ""}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((w) => (
          <div key={w.id} className="card flex flex-col overflow-hidden">
            <Link href={`/product/${w.slug}`} className="aspect-[4/5] bg-[#f6f1ea]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(w.image)} alt={w.name} className="size-full object-contain p-2" loading="lazy" />
            </Link>
            <div className="flex flex-1 flex-col p-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gold">{w.brand}</p>
              <Link href={`/product/${w.slug}`} className="line-clamp-2 text-sm">
                {w.name}
              </Link>
              <p className="mt-1 font-bold">{w.price ? formatINR(w.price) : "On request"}</p>
              <div className="mt-auto flex gap-2 pt-3">
                <Link
                  href={`/product/${w.slug}`}
                  onClick={(e) => {
                    if (!w.price) return;
                    e.preventDefault();
                    add({ productId: w.id, slug: w.slug, name: w.name, brand: w.brand, image: w.image, price: w.price });
                    remove(w.id);
                    toast("Moved to cart");
                  }}
                  className="btn-primary flex-1 !px-2 !py-2 text-xs"
                >
                  {w.price ? "Move to cart" : "View"}
                </Link>
                <button onClick={() => remove(w.id)} className="btn-outline !px-3 !py-2" aria-label="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

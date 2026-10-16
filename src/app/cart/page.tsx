"use client";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useMounted } from "@/components/Header";
import { PaymentBadges } from "@/components/PaymentBadges";
import { formatINR, FREE_SHIPPING_THRESHOLD, shippingFor, thumb } from "@/lib/format";
import { cartSubtotal, useCart, useWishlist } from "@/lib/store";

export default function CartPage() {
  const mounted = useMounted();
  const { items, setQty, remove } = useCart();
  const wishToggle = useWishlist((s) => s.toggle);
  if (!mounted) return <div className="container-x py-10"><div className="skeleton h-64 w-full rounded-lg" /></div>;

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const left = FREE_SHIPPING_THRESHOLD - subtotal;

  if (!items.length)
    return (
      <div className="container-x grid place-items-center py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-sand">
          <ShoppingBag size={34} className="text-maroon" />
        </span>
        <h1 className="h-display mt-5 text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Discover festive hampers, copper bottles, gadgets and more.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="h-display text-3xl font-semibold">Shopping cart</h1>
      <p className="text-sm text-muted">{items.length} item{items.length > 1 ? "s" : ""}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {left > 0 ? (
            <div className="rounded-md bg-gold-soft px-4 py-3 text-sm">
              Add <b>{formatINR(left)}</b> more for <b>FREE shipping</b>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-success">🎉 You&apos;ve unlocked free shipping</div>
          )}
          {items.map((i) => (
            <div key={i.key} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/product/${i.slug}`} className="size-24 shrink-0 overflow-hidden rounded-md bg-[#f6f1ea] sm:size-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(i.image)} alt="" className="size-full object-contain" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gold">{i.brand}</p>
                <Link href={`/product/${i.slug}`} className="line-clamp-2 text-sm font-medium">
                  {i.name}
                </Link>
                {i.variantLabel && <p className="text-xs text-muted">{i.variantLabel}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center rounded-md border border-line">
                    <button className="p-2" onClick={() => (i.qty > 1 ? setQty(i.key, i.qty - 1) : remove(i.key))} aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                    <button className="p-2" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-bold">{formatINR(i.price * i.qty)}</p>
                </div>
                <div className="mt-2 flex gap-4 text-xs font-medium text-muted">
                  <button onClick={() => remove(i.key)} className="flex items-center gap-1 hover:text-danger">
                    <Trash2 size={13} /> Remove
                  </button>
                  <button
                    onClick={() => {
                      wishToggle({ id: i.productId, slug: i.slug, name: i.name, brand: i.brand, image: i.image, price: i.price });
                      remove(i.key);
                    }}
                    className="hover:text-maroon"
                  >
                    Move to wishlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{shipping ? formatINR(shipping) : <span className="text-success">FREE</span>}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatINR(subtotal + shipping)}</dd>
              </div>
              <p className="text-xs text-muted">Prices are inclusive of GST.</p>
            </dl>
            <Link href="/checkout" className="btn-primary mt-5 hidden w-full !py-3.5 lg:flex">
              Proceed to checkout
            </Link>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={15} className="text-success" /> Secure payments by Razorpay — cards, UPI & net banking
            </p>
            <div className="mt-3">
              <PaymentBadges />
            </div>
          </div>
        </aside>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-white p-3 lg:hidden">
        <Link href="/checkout" className="btn-primary w-full !py-3.5">
          Checkout · {formatINR(subtotal + shipping)}
        </Link>
      </div>
    </div>
  );
}

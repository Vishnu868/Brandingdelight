"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Heart, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { formatINR, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { useCart, useToast, useWishlist } from "@/lib/store";
import { useMounted } from "./Header";
import { QuoteButton } from "./QuoteButton";
import type { Product } from "@/lib/types";
import { startRouteLoading } from "./RouteLoader";

export function BuyBox({ p }: { p: Product }) {
  const router = useRouter();
  const mounted = useMounted();
  const [variantId, setVariantId] = useState(p.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.push);
  const wished = useWishlist((s) => s.items.some((i) => i.id === p.id));
  const toggleWish = useWishlist((s) => s.toggle);

  const variant = p.variants.find((v) => v.id === variantId);
  const price = variant?.price ?? p.price;
  const priced = price != null && !(p.priceOnRequest && !variant);
  const soldOut = priced && p.stock <= 0;
  const buyable = priced && !soldOut;

  const addToCart = () => {
    if (!buyable) return;
    add(
      { productId: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.images[0] ?? "", variantId: variant?.id, variantLabel: variant?.label, price: price! },
      qty
    );
  };

  const quoteMsg = `Hi BrandingDelight, I'd like a quote for "${p.name}"${p.sku ? ` (${p.sku})` : ""}${variant ? ` – ${variant.label}` : ""}. Quantity: ${qty}.`;

  return (
    <div>
      <div className="flex items-end gap-3">
        {buyable || soldOut ? (
          <>
            <p className="text-[30px] font-bold leading-none">{formatINR(price!)}</p>
            <p className="pb-1 text-xs text-muted">MRP · inclusive of all taxes</p>
          </>
        ) : (
          <p className="text-2xl font-semibold text-maroon">Price on request</p>
        )}
      </div>
      {soldOut && <p className="mt-3 inline-block rounded-md bg-red-50 px-3 py-1 text-sm font-semibold text-danger">Out of stock</p>}
      {buyable && p.stock <= 5 && <p className="mt-3 text-sm font-semibold text-danger">Only {p.stock} left in stock</p>}
      {!priced && <p className="mt-1 text-sm text-muted">Bulk / corporate product — share your quantity and branding needs for the best price.</p>}

      {p.variants.length > 0 && (
        <div className="mt-6">
          <p className="label">Choose option</p>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`rounded-md border px-4 py-2.5 text-left text-sm transition ${v.id === variantId ? "border-maroon bg-maroon/5 ring-2 ring-maroon/15" : "border-line bg-white hover:border-ink/30"}`}
              >
                <span className="block font-semibold">{v.label}</span>
                <span className="text-xs text-muted">{formatINR(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <p className="label !mb-0">Qty</p>
        <div className="flex items-center rounded-md border border-line bg-white">
          <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus size={16} />
          </button>
          <input
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)))}
            inputMode="numeric"
            className="w-12 bg-transparent text-center font-semibold outline-none"
            aria-label="Quantity"
          />
          <button className="p-2.5" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Increase quantity">
            <Plus size={16} />
          </button>
        </div>
        {qty >= 25 && <span className="text-xs font-medium text-success">Bulk order? Ask for a corporate price.</span>}
      </div>

      <div className="mt-6 hidden gap-3 sm:flex">
        {buyable ? (
          <>
            <button
              className="btn-outline flex-1 !py-3.5"
              onClick={() => {
                addToCart();
                toast("Added to cart");
              }}
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
            <button
              className="btn-primary flex-1 !py-3.5"
              onClick={() => {
                addToCart();
                startRouteLoading();
                router.push("/checkout");
              }}
            >
              <Zap size={18} /> Buy now
            </button>
          </>
        ) : (
          <QuoteButton message={quoteMsg} className="btn-primary flex-1 !py-3.5" title={soldOut ? "Ask about restock" : "Get a quote"}>
            <MessageCircle size={18} /> {soldOut ? "Ask about restock on WhatsApp" : "Get a quote on WhatsApp"}
          </QuoteButton>
        )}
        <button
          className="btn-outline !px-4"
          aria-label="Wishlist"
          onClick={() => {
            toggleWish({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.images[0] ?? "", price });
            toast(wished ? "Removed from wishlist" : "Saved to wishlist");
          }}
        >
          <Heart size={18} className={mounted && wished ? "fill-maroon text-maroon" : ""} />
        </button>
      </div>

      {buyable && (
        <QuoteButton
          message={quoteMsg + " I need custom logo branding."}
          title="Corporate / bulk quote"
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-md border border-maroon/25 bg-maroon/[0.04] px-4 py-3 text-left transition hover:border-maroon/50 hover:bg-maroon/[0.07]"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-maroon text-white">
              <MessageCircle size={17} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-maroon">Get a corporate quote</span>
              <span className="block text-[12.5px] text-muted">Need your logo on it or 25+ units?</span>
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-maroon" />
        </QuoteButton>
      )}

      <div className="mt-6 rounded-lg border border-line bg-white p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPinMsg(/^[1-9]\d{5}$/.test(pin) ? (pin.startsWith("50") ? "Delivery in 1–3 days to " + pin : "Delivery in 3–7 days to " + pin) : "Enter a valid 6-digit pincode");
          }}
        >
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter delivery pincode" className="input !py-2.5" />
          <button className="btn-dark !py-2.5">Check</button>
        </form>
        {pinMsg && <p className="mt-2 text-sm text-success">{pinMsg}</p>}
        <ul className="mt-4 space-y-2.5 text-[13px] text-ink-soft">
          <li className="flex gap-2">
            <Truck size={17} className="shrink-0 text-gold" /> Free shipping on orders above {formatINR(FREE_SHIPPING_THRESHOLD)}
          </li>
          <li className="flex gap-2">
            <ShieldCheck size={17} className="shrink-0 text-gold" /> 100% genuine product with brand warranty
          </li>
        </ul>
      </div>

      {/* sticky mobile action bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white p-3 sm:hidden">
        <button
          className="btn-outline !px-3.5"
          aria-label="Wishlist"
          onClick={() => {
            toggleWish({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.images[0] ?? "", price });
            toast(wished ? "Removed from wishlist" : "Saved to wishlist");
          }}
        >
          <Heart size={19} className={mounted && wished ? "fill-maroon text-maroon" : ""} />
        </button>
        {buyable ? (
          <>
            <button
              className="btn-outline flex-1 !px-3"
              onClick={() => {
                addToCart();
                toast("Added to cart");
              }}
            >
              Add to cart
            </button>
            <button
              className="btn-primary flex-1 !px-3"
              onClick={() => {
                addToCart();
                startRouteLoading();
                router.push("/checkout");
              }}
            >
              Buy · {formatINR(price! * qty)}
            </button>
          </>
        ) : (
          <QuoteButton message={quoteMsg} className="btn-primary flex-1" title={soldOut ? "Ask about restock" : "Get a quote"}>
            <MessageCircle size={18} /> {soldOut ? "Ask about restock" : "Get a quote"}
          </QuoteButton>
        )}
      </div>
    </div>
  );
}

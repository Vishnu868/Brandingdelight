"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { cartCount, useCart, useUi, useWishlist } from "@/lib/store";
import { useMounted } from "./Header";

export function MobileTabBar() {
  const path = usePathname();
  const mounted = useMounted();
  const cart = useCart((s) => cartCount(s.items));
  const wish = useWishlist((s) => s.items.length);
  const setSearch = useUi((s) => s.setSearch);
  if (path.startsWith("/admin") || path.startsWith("/checkout") || path.startsWith("/product/")) return null;

  const tab = (href: string, label: string, Icon: typeof Home, badge = 0) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link href={href} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium ${active ? "text-maroon" : "text-muted"}`}>
        <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
        {label}
        {mounted && badge > 0 && (
          <span className="absolute left-1/2 top-1 ml-2 grid min-w-[17px] place-items-center rounded-full bg-maroon px-1 text-[9.5px] font-bold leading-[17px] text-white">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="flex">
        {tab("/", "Home", Home)}
        {tab("/categories", "Categories", LayoutGrid)}
        <button onClick={() => setSearch(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium text-muted">
          <Search size={21} strokeWidth={1.8} />
          Search
        </button>
        {tab("/wishlist", "Wishlist", Heart, wish)}
        {tab("/cart", "Cart", ShoppingBag, cart)}
      </div>
    </nav>
  );
}

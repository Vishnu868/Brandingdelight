"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Heart, LayoutDashboard, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { useAuth } from "./AuthProvider";
import { cartCount, useCart, useUi, useWishlist } from "@/lib/store";
import { SITE } from "@/lib/format";
import type { Category } from "@/lib/types";

const QUICK = [
  { label: "Diwali Hampers", href: "/category/festive-hampers-gift-boxes" },
  { label: "Chocolates", href: "/category/gourmet-chocolates" },
  { label: "Appliances", href: "/category/home-kitchen-appliances" },
  { label: "Copper", href: "/category/copper-collection" },
  { label: "Tech", href: "/category/mobile-tech-accessories" },
  { label: "Luggage", href: "/category/travel-luggage" },
  { label: "Corporate Gifting", href: "/corporate-gifting" },
];

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function Header({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const wish = useWishlist((s) => s.items.length);
  const { menuOpen, setMenu, searchOpen, setSearch } = useUi();
  const { user, isAdmin } = useAuth();
  const [mega, setMega] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setMenu(false);
    setSearch(false);
    setMega(false);
  }, [pathname, setMenu, setSearch]);

  if (pathname.startsWith("/admin")) return null;
  const count = mounted ? cartCount(items) : 0;

  return (
    <>
      <div className="bg-ink text-[12px] text-white/80">
        <div className="container-x flex h-9 items-center justify-between gap-4">
          <div className="no-scrollbar flex min-w-0 flex-1 overflow-hidden">
            <div className="flex shrink-0 animate-marquee gap-12 whitespace-nowrap md:animate-none">
              {[0, 1].map((k) => (
                <span key={k} className={`flex gap-12 ${k === 1 ? "md:hidden" : ""}`} aria-hidden={k === 1}>
                  <span>✦ Free shipping on orders above ₹999</span>
                  <span>✦ Custom logo branding on bulk orders</span>
                  <span>✦ Pay with UPI, Cards, Amex & Net Banking</span>
                </span>
              ))}
            </div>
          </div>
          <a href={`tel:${SITE.phoneRaw}`} className="hidden items-center gap-1.5 hover:text-white md:flex">
            <Phone size={13} /> {SITE.phone}
          </a>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 border-b bg-cream/95 backdrop-blur transition-shadow ${scrolled ? "border-line shadow-[0_6px_24px_-16px_rgba(0,0,0,.35)]" : "border-transparent"}`}
      >
        <div className="container-x flex h-16 items-center gap-3 lg:h-[76px] lg:gap-8">
          <button className="-ml-2 rounded-full p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}>
            <Menu size={22} />
          </button>
          <Logo />
          <div className="hidden flex-1 lg:block">
            <SearchBox />
          </div>
          <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button className="rounded-full p-2.5 hover:bg-sand lg:hidden" aria-label="Search" onClick={() => setSearch(true)}>
              <Search size={21} />
            </button>
            {isAdmin && (
              <Link href="/admin" className="hidden items-center gap-1.5 rounded-full bg-gold-soft px-3 py-2 text-xs font-semibold text-gold sm:flex">
                <LayoutDashboard size={15} /> Admin
              </Link>
            )}
            <Link href={user ? "/account" : "/login"} className="hidden rounded-full p-2.5 hover:bg-sand sm:block" aria-label="Account">
              <User size={21} />
            </Link>
            <Link href="/wishlist" className="relative hidden rounded-full p-2.5 hover:bg-sand sm:block" aria-label="Wishlist">
              <Heart size={21} />
              {mounted && wish > 0 && <Badge n={wish} />}
            </Link>
            <Link href="/cart" className="relative rounded-full p-2.5 hover:bg-sand" aria-label="Cart">
              <ShoppingBag size={21} />
              {count > 0 && <Badge n={count} />}
            </Link>
          </nav>
        </div>

        <div className="hidden border-t border-line/70 lg:block" onMouseLeave={() => setMega(false)}>
          <div className="container-x flex h-11 items-center gap-7 text-[13.5px] font-medium">
            <button
              className={`flex items-center gap-1.5 ${mega ? "text-maroon" : ""}`}
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega((v) => !v)}
            >
              <Menu size={16} /> All Categories <ChevronDown size={15} className={`transition ${mega ? "rotate-180" : ""}`} />
            </button>
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="text-ink-soft transition hover:text-maroon" onMouseEnter={() => setMega(false)}>
                {q.label}
              </Link>
            ))}
            <Link href="/brands" className="ml-auto text-ink-soft hover:text-maroon">
              Brands
            </Link>
            <Link href="/shop?sort=new" className="text-maroon">
              New Arrivals
            </Link>
          </div>
          {mega && (
            <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-[var(--shadow-pop)] animate-fade-up">
              <div className="container-x grid max-h-[70vh] grid-cols-4 gap-x-8 gap-y-6 overflow-y-auto py-8">
                {categories.map((c) => (
                  <div key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="h-display text-[15px] font-semibold hover:text-maroon">
                      {c.name}
                    </Link>
                    <ul className="mt-2 space-y-1.5">
                      {c.subcategories.slice(0, 6).map((s) => (
                        <li key={s.slug}>
                          <Link href={`/category/${c.slug}?sub=${s.slug}`} className="text-[13px] text-muted hover:text-maroon">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-cream animate-fade-up lg:hidden">
          <div className="flex items-center gap-2 border-b border-line p-3">
            <div className="flex-1">
              <SearchBox autoFocus onNavigate={() => setSearch(false)} />
            </div>
            <button className="rounded-full p-2" onClick={() => setSearch(false)} aria-label="Close search">
              <X size={22} />
            </button>
          </div>
          <div className="p-4">
            <p className="label">Popular</p>
            <div className="flex flex-wrap gap-2">
              {["Hamper", "Copper bottle", "Air fryer", "Power bank", "Trolley", "Chocolate", "Desk organiser", "Speaker"].map((t) => (
                <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="chip" onClick={() => setSearch(false)}>
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-cream shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-line p-4">
              <Logo />
              <button onClick={() => setMenu(false)} className="rounded-full p-2" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Link href={user ? "/account" : "/login"} className="m-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
                <span className="grid size-10 place-items-center rounded-full bg-maroon text-white">
                  <User size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{user ? user.displayName || user.email || user.phoneNumber : "Sign in / Register"}</span>
                  <span className="block text-xs text-muted">{user ? "View orders & profile" : "Track orders, save wishlist"}</span>
                </span>
              </Link>
              {isAdmin && (
                <Link href="/admin" className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-gold-soft px-4 py-3 text-sm font-semibold text-gold">
                  <LayoutDashboard size={16} /> Admin dashboard
                </Link>
              )}
              <p className="label px-5 pt-2">Shop by category</p>
              <ul>
                {categories.map((c) => (
                  <DrawerCategory key={c.slug} c={c} />
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-line px-5 py-4 text-sm">
                {[
                  ["All Brands", "/brands"],
                  ["Corporate Gifting", "/corporate-gifting"],
                  ["About Us", "/about"],
                  ["Contact", "/contact"],
                  ["FAQs", "/faq"],
                ].map(([l, h]) => (
                  <Link key={h} href={h} className="block py-2 text-ink-soft">
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function DrawerCategory({ c }: { c: Category }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-line/60">
      <div className="flex items-center">
        <Link href={`/category/${c.slug}`} className="flex flex-1 items-center gap-3 px-5 py-3.5 text-[15px]">
          {c.name}
        </Link>
        <button className="px-5 py-3.5 text-muted" onClick={() => setOpen(!open)} aria-label={`Show ${c.name} subcategories`}>
          <ChevronRight size={18} className={`transition ${open ? "rotate-90" : ""}`} />
        </button>
      </div>
      {open && (
        <ul className="bg-white/60 pb-2">
          {c.subcategories.map((s) => (
            <li key={s.slug}>
              <Link href={`/category/${c.slug}?sub=${s.slug}`} className="block px-8 py-2.5 text-sm text-ink-soft">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-maroon px-1 text-[10px] font-bold leading-[18px] text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

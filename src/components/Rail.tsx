import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductCard as Card } from "@/lib/types";

/** Horizontal swipe rail on mobile, grid on desktop. */
export function Rail({ title, eyebrow, href, items }: { title: string; eyebrow?: string; href: string; items: Card[] }) {
  if (!items.length) return null;
  return (
    <section className="container-x mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="h-display mt-1 text-[26px] font-semibold leading-tight sm:text-[32px]">{title}</h2>
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-maroon">
          View all <ArrowRight size={16} />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {items.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

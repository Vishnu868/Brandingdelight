import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-muted">
      {items.map(([label, href], i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          {href ? (
            <Link href={href} className="hover:text-maroon">
              {label}
            </Link>
          ) : (
            <span className="text-ink-soft">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

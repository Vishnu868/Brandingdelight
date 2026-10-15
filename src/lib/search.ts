import type { ProductCard } from "./types";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ");

/** Token-based search with simple field weighting; good enough for ~1k products and runs in < 1 ms. */
export function searchCards(cards: ProductCard[], q: string) {
  const terms = norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));
  if (!terms.length) return cards;
  const scored: [number, ProductCard][] = [];
  for (const c of cards) {
    const name = norm(c.name);
    const meta = norm(`${c.brand} ${c.category} ${c.subcategory}`);
    let score = 0;
    let all = true;
    for (const t of terms) {
      const inName = name.includes(t);
      const inMeta = meta.includes(t);
      if (!inName && !inMeta) {
        all = false;
        break;
      }
      score += (inName ? 3 : 0) + (inMeta ? 1 : 0) + (name.startsWith(t) ? 2 : 0);
    }
    if (all) scored.push([score, c]);
  }
  return scored.sort((a, b) => b[0] - a[0]).map((s) => s[1]);
}

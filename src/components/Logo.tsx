import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="23" fill="#7b1e2b" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="#d9b36c" strokeWidth="1" strokeDasharray="2 2.4" />
      <text x="24" y="30.5" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#fff" letterSpacing="-1">
        BD
      </text>
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="BrandingDelight home">
      <LogoMark />
      <span className="leading-none">
        <span className={`h-display block text-[19px] font-semibold ${light ? "text-white" : "text-ink"}`}>
          Branding<span className="text-gold">Delight</span>
        </span>
        <span className={`mt-0.5 block whitespace-nowrap text-[8.5px] font-medium uppercase tracking-[0.2em] ${light ? "text-white/60" : "text-muted"}`}>
          Premium Gifting Store
        </span>
      </span>
    </Link>
  );
}

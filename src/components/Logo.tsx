import Link from "next/link";

/** The BD monogram from the official BrandingDelight logo (transparent PNG, gold). */
export function LogoMark({ size = 40 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

/** Full official logo — monogram, wordmark and tagline. `light` = for dark backgrounds. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="block shrink-0" aria-label="Branding Delight home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light ? "/logo-horizontal.png" : "/logo-horizontal-dark.png"}
        alt="Branding Delight — Branding | Corporate Gifting | Clothing"
        width={896}
        height={153}
        className="h-[34px] w-auto sm:h-11"
        fetchPriority="high"
      />
    </Link>
  );
}

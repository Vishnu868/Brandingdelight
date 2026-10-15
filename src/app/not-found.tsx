import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-24 text-center">
      <p className="h-display text-7xl font-semibold text-maroon">404</p>
      <h1 className="h-display mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or the product is no longer available.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/shop" className="btn-outline">
          Browse products
        </Link>
      </div>
    </div>
  );
}

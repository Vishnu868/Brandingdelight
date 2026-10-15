import { ProductCardSkeleton } from "./ProductCard";

export function ListingSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="container-x py-6">
      {title && (
        <div className="mb-6 space-y-3">
          <div className="skeleton h-3 w-40" />
          <div className="skeleton h-8 w-72" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

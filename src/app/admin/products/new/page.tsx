"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAdminData } from "@/lib/use-admin";
import type { Product } from "@/lib/types";

function NewProduct() {
  const from = useSearchParams().get("from");
  const { data, loading } = useAdminData<{ products: Product[] }>(from ? "/api/admin/products" : null);
  const source = from ? data?.products.find((p) => p.id === from) : undefined;
  if (from && loading) return <div className="skeleton h-[70vh] rounded-2xl" />;
  return (
    <div>
      <h1 className="h-display text-3xl font-semibold">{source ? "Duplicate product" : "Add product"}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {source ? `Pre-filled from "${source.name}" — change what's different and publish.` : "Fill in the details and publish — it appears on the store immediately."}
      </p>
      <ProductForm key={source?.id ?? "new"} copyOf={source} />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProduct />
    </Suspense>
  );
}

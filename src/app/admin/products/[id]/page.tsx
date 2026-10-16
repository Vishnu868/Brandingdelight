"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAdminData } from "@/lib/use-admin";
import type { Product } from "@/lib/types";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAdminData<{ products: Product[] }>("/api/admin/products");
  const product = data?.products.find((p) => p.id === decodeURIComponent(id));

  if (loading) return <div className="skeleton h-[70vh] rounded-lg" />;
  if (error) return <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">{error}</p>;
  if (!product) return <p>Product not found.</p>;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-display text-3xl font-semibold">Edit product</h1>
        <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline !py-2">
          <ExternalLink size={15} /> View on store
        </Link>
      </div>
      <ProductForm initial={product} />
    </div>
  );
}

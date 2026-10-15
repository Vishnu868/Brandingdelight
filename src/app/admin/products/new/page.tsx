"use client";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="h-display mb-5 text-3xl font-semibold">Add product</h1>
      <ProductForm />
    </div>
  );
}

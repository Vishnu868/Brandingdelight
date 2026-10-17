import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";
import { ListingSkeleton } from "@/components/ListingSkeleton";
import { getCards } from "@/lib/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "Shop all products", description: "Browse 3,000+ premium gifts, gift sets, appliances, hampers, copper, brass, tech and luggage." };

export default async function ShopPage() {
  const cards = await getCards();
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumbs items={[["Home", "/"], ["Shop"]]} />
      <h1 className="h-display mt-3 text-3xl font-semibold sm:text-4xl">Shop all products</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        {cards.length} premium products across {new Set(cards.map((c) => c.category)).size} categories
      </p>
      <Suspense fallback={<ListingSkeleton title={false} />}>
        <Listing cards={cards} />
      </Suspense>
    </div>
  );
}

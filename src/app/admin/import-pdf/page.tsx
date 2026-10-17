import { getCategories } from "@/lib/catalog";
import { PdfImport } from "@/components/admin/PdfImport";

export const dynamic = "force-dynamic";

export default async function ImportPdfPage() {
  const categories = (await getCategories()).map((c) => c.name);
  return <PdfImport categories={categories} />;
}

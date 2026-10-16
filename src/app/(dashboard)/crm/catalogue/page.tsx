import { Suspense } from "react";
import { CatalogueView } from "./components/CatalogueView";

export default async function ProductsAndPlansPage({ searchParams }: { searchParams: Promise<{ product?: string; archived?: string }> }) {
  const { product, archived } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CatalogueView productCode={product} showArchived={archived === "1"}  />
    </Suspense>
  );
}

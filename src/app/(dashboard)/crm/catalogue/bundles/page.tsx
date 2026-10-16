import { Suspense } from "react";
import { BundlesView } from "../components/BundlesView";

export default async function BundlesPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { archived } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <BundlesView showArchived={archived === "1"}  />
    </Suspense>
  );
}

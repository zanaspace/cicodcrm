import { Suspense } from "react";
import { PlanEditor } from "../../components/PlanEditor";

export default async function PlanPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ product?: string }> }) {
  const { code } = await params;
  const { product } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PlanEditor code={code} productCode={product}  />
    </Suspense>
  );
}

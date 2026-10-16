import { Suspense } from "react";
import { LeadView } from "../../components/LeadView";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <LeadView id={id}  />
    </Suspense>
  );
}

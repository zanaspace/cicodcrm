import { Suspense } from "react";
import { PartnerView } from "../../components/PartnerView";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PartnerView id={id}  />
    </Suspense>
  );
}

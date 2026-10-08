import { Suspense } from "react";
import { CampaignEditor } from "../../components/CampaignEditor";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CampaignEditor id={id}  />
    </Suspense>
  );
}

import { Suspense } from "react";
import { CampaignsView } from "../components/CampaignsView";

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CampaignsView />
    </Suspense>
  );
}

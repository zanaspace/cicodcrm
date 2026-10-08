import { Suspense } from "react";
import { DunningView } from "../components/DunningView";

export default function DunningPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <DunningView  />
    </Suspense>
  );
}

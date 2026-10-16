import { Suspense } from "react";
import { LeadsView } from "../components/LeadsView";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <LeadsView />
    </Suspense>
  );
}

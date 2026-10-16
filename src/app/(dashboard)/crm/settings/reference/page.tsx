import { Suspense } from "react";
import { ReferenceView } from "../components/ReferenceView";

export default function ReferencePage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <ReferenceView />
    </Suspense>
  );
}

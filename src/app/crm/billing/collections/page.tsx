import { Suspense } from "react";
import { CollectionsView } from "../components/CollectionsView";

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CollectionsView />
    </Suspense>
  );
}

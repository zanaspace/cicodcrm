import { Suspense } from "react";
import { SubscribersView } from "../../components/SubscribersView";

export default function SubscribersPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <SubscribersView  />
    </Suspense>
  );
}

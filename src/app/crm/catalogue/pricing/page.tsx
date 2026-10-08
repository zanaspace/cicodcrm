import { Suspense } from "react";
import { PricingView } from "../components/PricingView";

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PricingView  />
    </Suspense>
  );
}

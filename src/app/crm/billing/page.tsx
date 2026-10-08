import { Suspense } from "react";
import { BillingOverview } from "./components/BillingOverview";

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <BillingOverview  />
    </Suspense>
  );
}

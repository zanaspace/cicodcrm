import { Suspense } from "react";
import { CommissionView } from "../components/CommissionView";

export default function CommissionPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CommissionView  />
    </Suspense>
  );
}

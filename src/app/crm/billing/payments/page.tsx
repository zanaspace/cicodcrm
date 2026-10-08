import { Suspense } from "react";
import { PaymentsView } from "../components/PaymentsView";

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PaymentsView />
    </Suspense>
  );
}

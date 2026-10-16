import { Suspense } from "react";
import { CustomersView } from "./components/CustomersView";

export default function CustomersPage() {
  // CustomersView reads filters from the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CustomersView />
    </Suspense>
  );
}

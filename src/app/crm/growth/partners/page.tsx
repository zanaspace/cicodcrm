import { Suspense } from "react";
import { PartnersView } from "../components/PartnersView";

export default function PartnersPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PartnersView />
    </Suspense>
  );
}

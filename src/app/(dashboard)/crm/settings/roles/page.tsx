import { Suspense } from "react";
import { RolesView } from "../components/RolesView";

export default function RolesPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <RolesView />
    </Suspense>
  );
}

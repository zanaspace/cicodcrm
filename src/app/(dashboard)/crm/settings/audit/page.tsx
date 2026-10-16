import { Suspense } from "react";
import { AuditView } from "../components/AuditView";

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <AuditView />
    </Suspense>
  );
}

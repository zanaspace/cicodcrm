import { Suspense } from "react";
import { StudioAdmin } from "../components/StudioAdmin";

export default function StudioAdminPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <StudioAdmin />
    </Suspense>
  );
}

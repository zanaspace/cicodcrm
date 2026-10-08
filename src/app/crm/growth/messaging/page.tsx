import { Suspense } from "react";
import { TemplatesView } from "../components/TemplatesView";

export default function MessagingPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <TemplatesView  />
    </Suspense>
  );
}

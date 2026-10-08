import { Suspense } from "react";
import { StudioContacts } from "../components/StudioContacts";

export default function StudioContactsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <StudioContacts />
    </Suspense>
  );
}

import { Suspense } from "react";
import { UsersView } from "../components/UsersView";

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <UsersView />
    </Suspense>
  );
}

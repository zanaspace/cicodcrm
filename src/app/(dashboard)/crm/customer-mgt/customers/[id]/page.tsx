import { Suspense } from "react";
import { CustomerView } from "./components/CustomerView";

export default async function CustomerDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <CustomerView id={id} tab={tab}  />
    </Suspense>
  );
}

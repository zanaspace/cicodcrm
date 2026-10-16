import { Suspense } from "react";
import { BundleEditor } from "../../components/BundleEditor";

export default async function BundlePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ group?: string }> }) {
  const { code } = await params;
  const { group } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <BundleEditor code={code} groupKey={group}  />
    </Suspense>
  );
}

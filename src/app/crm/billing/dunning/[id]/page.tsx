import { Suspense } from "react";
import { PolicyEditor } from "../../components/PolicyEditor";

export default async function PolicyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ model?: string; from?: string }> }) {
  const { id } = await params;
  const { model, from } = await searchParams;
  return (
    <Suspense fallback={<div className="skeleton h-[480px] w-full rounded-xl" />}>
      <PolicyEditor id={id} model={model} from={from}  />
    </Suspense>
  );
}

import { Skeleton } from "@/components/ui/primitives/skeleton";

/** Shown while a page's code and data are loading. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}

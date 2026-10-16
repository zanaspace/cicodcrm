import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-[460px] bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center flex flex-col items-center gap-3">
        <SearchX className="w-8 h-8 text-[var(--muted-foreground)]" aria-hidden />
        <h1 className="m-0 font-heading text-[1.25rem] font-bold">We couldn&apos;t find that page</h1>
        <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">The link may be out of date, or the record may have been removed.</p>
        <Link href="/" className="mt-2 font-semibold text-[var(--primary)] hover:underline">Go to the dashboard</Link>
      </div>
    </main>
  );
}

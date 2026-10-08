"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A yes/no state kept in the URL (e.g. `?new=1` opens the New Customer wizard),
 * so favorites and shared links can open a form directly. Needs a <Suspense> boundary above it.
 */
export function useUrlFlag(name: string): [boolean, (open: boolean) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const open = params.get(name) === "1";
  const set = (value: boolean) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, "1"); else next.delete(name);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return [open, set];
}

/** URL flags that open a form; they are left out when a page is saved as a favorite. */
export const ACTION_FLAGS = ["new", "invite", "generate"];

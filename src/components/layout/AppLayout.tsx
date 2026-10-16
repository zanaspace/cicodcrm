"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSession } from "@/features/auth/hooks";
import { RequirePathAccess } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/primitives/skeleton";

const COLLAPSED_KEY = "cicod_crm_sidebar_collapsed";

const COLLAPSED_EVENT = "crm-sidebar-collapsed";

/** Sidebar collapsed preference, kept in localStorage. Collapsed until the user expands it. */
const collapsedStore = {
  subscribe(cb: () => void) {
    window.addEventListener(COLLAPSED_EVENT, cb);
    window.addEventListener("storage", cb);
    return () => { window.removeEventListener(COLLAPSED_EVENT, cb); window.removeEventListener("storage", cb); };
  },
  get() {
    try { return localStorage.getItem(COLLAPSED_KEY) !== "false"; } catch { return true; }
  },
  set(value: boolean) {
    try { localStorage.setItem(COLLAPSED_KEY, String(value)); } catch {}
    window.dispatchEvent(new Event(COLLAPSED_EVENT));
  },
};

/**
 * Signed-in shell: sidebar, header and the page. Waits for the session (user, role, module access) before
 * rendering the page, then shows a "no access" state for pages the user's role cannot open.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSyncExternalStore(collapsedStore.subscribe, collapsedStore.get, () => true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const session = useSession();

  // Close the mobile drawer after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleSidebar = () => collapsedStore.set(!isCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleSidebar} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <main
        className={`flex-1 min-w-0 flex flex-col h-screen overflow-hidden transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        }`}
      >
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {session.isPending ? (
            <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-[420px] w-full rounded-xl" />
            </div>
          ) : (
            <RequirePathAccess pathname={pathname}>{children}</RequirePathAccess>
          )}
        </div>
      </main>
    </div>
  );
}

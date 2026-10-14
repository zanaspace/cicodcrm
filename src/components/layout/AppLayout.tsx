"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  // Default state is closed (collapsed = true) per user requirement
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load user preference from localStorage if previously set, otherwise default to closed (true)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cicod_crm_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cicod_crm_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Simulate network latency on route changes for the prototype.
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // The sign-in screen and the full-screen Campaign Studio email editor have no sidebar or header.
  if (pathname === "/login" || /^\/crm\/studio\/templates\/[^/]+\/edit$/.test(pathname)) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleSidebar} />
      
      <main 
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Header />
        <div className="flex-1 overflow-y-auto p-8">
          {isTransitioning ? (
            <div className="w-full h-[480px] skeleton rounded-xl opacity-80" />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

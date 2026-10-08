"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      
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

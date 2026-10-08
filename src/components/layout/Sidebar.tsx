"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { ChevronDown, Menu, Folder } from "lucide-react";
import { NAV, isFolder, matchNav, type NavGroup } from "@/lib/nav";
import { FavoritesSection } from "./favorites";

type NavItemProps = {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isCollapsed: boolean;
  toggleCollapse: () => void;
};

function NavAccordionItem({ title, icon: Icon, defaultOpen = false, children, isCollapsed, toggleCollapse }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <li className="mb-1" title={isCollapsed ? title : undefined}>
      <button
        type="button"
        aria-expanded={isOpen && !isCollapsed}
        onClick={() => {
          if (isCollapsed) {
            toggleCollapse();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
          isOpen && !isCollapsed
            ? "text-[var(--sidebar-accent-foreground)] bg-[var(--accent)] font-heading font-semibold"
            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] font-medium"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-[0.92rem] truncate">{title}</span>}
        </div>
        {!isCollapsed && <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "" : "-rotate-90"}`} />}
      </button>

      {!isCollapsed && (
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <ul className="pl-10 mt-1.5 mb-2.5 flex flex-col gap-1">
              {children}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

function NavLinkItem({ group, active, isCollapsed }: { group: NavGroup; active: boolean; isCollapsed: boolean }) {
  const Icon = group.icon;
  return (
    <li className="mb-1" title={isCollapsed ? group.title : undefined}>
      <Link
        href={group.href!}
        aria-current={active ? "page" : undefined}
        className={`flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          active
            ? "text-[var(--sidebar-accent-foreground)] bg-[var(--accent)] font-heading font-semibold"
            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] font-medium"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="text-[0.92rem] truncate">{group.title}</span>}
      </Link>
    </li>
  );
}

function SubLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`block py-1.5 text-[0.88rem] transition-colors truncate ${
          active
            ? "text-[var(--primary)] font-heading font-semibold"
            : "text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-accent-foreground)]"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

function NestedAccordion({ title, children, openByDefault = false }: { title: string, children: React.ReactNode, openByDefault?: boolean }) {
  const [isOpen, setIsOpen] = useState(openByDefault);

  return (
    <li className="mb-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors cursor-pointer text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-accent-foreground)]"
      >
        <span className="text-[0.88rem] truncate flex items-center gap-2">
          <Folder className="w-4 h-4" />
          {title}
        </span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "" : "-rotate-90"}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <ul className="pl-6 mt-1 flex flex-col gap-1 border-l border-[var(--sidebar-border)] ml-4">
            {children}
          </ul>
        </div>
      </div>
    </li>
  );
}

export function Sidebar({ isCollapsed, toggleCollapse }: { isCollapsed: boolean, toggleCollapse: () => void }) {
  const pathname = usePathname();
  const match = matchNav(pathname);

  return (
    <aside className={`bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] flex flex-col h-screen fixed inset-y-0 left-0 z-50 transition-[width] duration-300 ease-in-out ${
      isCollapsed ? "w-[72px]" : "w-[260px]"
    }`}>

      {/* Brand Header */}
      <div className={`h-[70px] px-5 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'} border-b border-[var(--sidebar-border)] overflow-hidden`}>
        {!isCollapsed && (
          <Link href="/" className="h-[58px] flex items-center shrink-0" aria-label="CICOD CRM home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cicod-crm-logo-light.png" alt="CICOD CRM" className="logo-light h-full w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cicod-crm-logo-dark.png" alt="CICOD CRM" className="logo-dark h-full w-auto object-contain" />
          </Link>
        )}
        <button onClick={toggleCollapse} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-accent-foreground)] transition-colors p-1.5 rounded-md hover:bg-[var(--sidebar-accent)] shrink-0">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main" className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} custom-scrollbar`}>
        <Suspense fallback={null}><FavoritesSection isCollapsed={isCollapsed} /></Suspense>
        {NAV.map((section, si) => (
          <ul key={section.caption} className="flex flex-col gap-1">
            {!isCollapsed ? (
              <div className={`text-[0.75rem] text-[#6B7787] uppercase font-semibold tracking-wider px-3 pb-2 truncate ${si === 0 ? "pt-4" : "pt-5"}`}>{section.caption}</div>
            ) : (
              <div className="h-0 border-b border-[var(--sidebar-border)] w-8 mx-auto my-4"></div>
            )}

            {section.groups.map((group) =>
              group.href ? (
                <NavLinkItem key={group.title} group={group} active={match?.group === group && !match.leaf} isCollapsed={isCollapsed} />
              ) : (
                <NavAccordionItem
                  key={group.title}
                  isCollapsed={isCollapsed}
                  toggleCollapse={toggleCollapse}
                  title={group.title}
                  icon={group.icon}
                  defaultOpen={match?.group === group}
                >
                  {group.children!.map((child) =>
                    isFolder(child) ? (
                      <NestedAccordion key={child.label} title={child.label} openByDefault={match?.folder === child}>
                        {child.children.map((leaf) => (
                          <SubLink key={leaf.href} href={leaf.href} active={match?.leaf === leaf}>{leaf.label}</SubLink>
                        ))}
                      </NestedAccordion>
                    ) : (
                      <SubLink key={child.href} href={child.href} active={match?.leaf === child}>{child.label}</SubLink>
                    ),
                  )}
                </NavAccordionItem>
              ),
            )}
          </ul>
        ))}
      </nav>

    </aside>
  );
}

"use client";

import { Bell, ChevronRight, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense, useSyncExternalStore } from "react";
import { matchNav } from "@/lib/nav";
import { FavoriteStar, FavoritesManager } from "./favorites";
import { ProfileMenu } from "./ProfileMenu";
import { useCustomers } from "@/lib/mock/customers";
import { useBundles, usePlans } from "@/lib/mock/catalogue";
import { usePolicies } from "@/lib/mock/billing";
import { useCampaigns, useLeads, usePartners } from "@/lib/mock/growth";
import { useStudioTemplates } from "@/lib/studio/templates";
import { useStudioCampaigns } from "@/lib/studio/campaigns";

const THEME_EVENT = "crm-theme-change";

function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

type Crumb = { label: string; href?: string };

/** Breadcrumb from the nav config, plus the record name on detail pages. */
function useBreadcrumb(): Crumb[] {
  const pathname = usePathname();
  const customers = useCustomers();
  const plans = usePlans();
  const bundles = useBundles();
  const policies = usePolicies();
  const leads = useLeads();
  const campaigns = useCampaigns();
  const partners = usePartners();
  const studioTemplates = useStudioTemplates();
  const studioCampaigns = useStudioCampaigns();
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  if (pathname === "/") return [{ label: "Home" }, { label: "Dashboard" }];

  const match = matchNav(pathname);
  if (!match) return [...crumbs, { label: "Not found" }];
  const leafLabel = match.leaf?.label ?? match.group.title;
  // Skip the group crumb when the leaf has the same name (Partners › Partners).
  if (match.leaf && match.group.title !== leafLabel) crumbs.push({ label: match.group.title });
  // Single-link groups (Campaign Studio pages) show their sidebar section.
  if (!match.leaf && match.group.href && match.section !== "Daily Operations") crumbs.push({ label: match.section });
  if (match.folder) crumbs.push({ label: match.folder.label });

  const rest = pathname.slice(match.href.length).split("/").filter(Boolean);
  if (rest.length === 0) return [...crumbs, { label: leafLabel }];
  crumbs.push({ label: leafLabel, href: match.href });

  // Detail / editor pages under a list.
  const [first, second] = rest;
  if (match.href === "/crm/customer-mgt/customers") {
    const c = customers.find((x) => x.cicod === first);
    crumbs.push({ label: c ? c.company : `#${first}` });
  } else if (first === "plans") {
    crumbs.push({ label: second === "new" ? "New plan" : plans.find((p) => p.code === second)?.name ? `${plans.find((p) => p.code === second)!.name} (${second})` : second });
  } else if (match.href === "/crm/catalogue/bundles") {
    crumbs.push({ label: first === "new" ? "New bundle" : bundles.find((b) => b.code === first)?.name ?? first });
  } else if (match.href === "/crm/growth/leads") {
    crumbs.push({ label: leads.find((l) => l.id === first)?.company ?? first });
  } else if (match.href === "/crm/growth/campaigns") {
    crumbs.push({ label: first === "new" ? "New campaign" : campaigns.find((c) => c.id === first)?.name ?? first });
  } else if (match.href === "/crm/growth/partners") {
    crumbs.push({ label: partners.find((p) => p.id === first)?.name ?? first });
  } else if (match.href === "/crm/studio/templates") {
    crumbs.push({ label: studioTemplates.find((t) => t.id === first)?.name ?? first, href: second ? `/crm/studio/templates/${first}` : undefined });
    if (second === "compare") crumbs.push({ label: "Compare versions" });
  } else if (match.href === "/crm/studio/campaigns") {
    crumbs.push({ label: studioCampaigns.find((c) => c.id === first)?.name ?? first });
  } else if (match.href === "/crm/billing/dunning") {
    crumbs.push({ label: first === "new" ? "New policy" : policies.find((p) => p.id === first)?.name ?? first });
  } else {
    crumbs.push({ label: decodeURIComponent(first) });
  }
  return crumbs;
}

export function Header() {
  const crumbs = useBreadcrumb();
  const isDark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("crm-theme", next ? "dark" : "light"); } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <header className="h-[70px] bg-[var(--background)] border-b border-[var(--border)] px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">

      {/* Breadcrumbs, then the star that pins this page to Favorites */}
      <div className="flex items-center gap-2 min-w-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[0.9rem] text-[var(--muted-foreground)] min-w-0">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
              {last ? (
                <span aria-current="page" className="font-heading font-semibold text-[var(--foreground)] truncate">{c.label}</span>
              ) : c.href ? (
                <Link href={c.href} className="hover:text-[var(--foreground)] transition-colors whitespace-nowrap">{c.label}</Link>
              ) : (
                <span className="whitespace-nowrap">{c.label}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
      {crumbs[crumbs.length - 1].label !== "Not found" && (
        <Suspense fallback={null}><FavoriteStar pageLabel={crumbs[crumbs.length - 1].label} /></Suspense>
      )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">

        {/* Theme Toggle (Switch) */}
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[var(--muted-foreground)]" />
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dark mode"
            onClick={toggleTheme}
            className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex items-center ${isDark ? "bg-[var(--primary)]" : "bg-[var(--input)]"}`}
          >
            <div className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDark ? "translate-x-5" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 border-l border-[var(--border)] pl-6">
          <button aria-label="Notifications" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <ProfileMenu />
        </div>

      </div>

      <FavoritesManager />
    </header>
  );
}

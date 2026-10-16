"use client";

import { Bell, ChevronRight, Menu, Moon, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense, useSyncExternalStore, type ReactNode } from "react";
import { matchNav } from "@/lib/nav";
import { FavoriteStar, FavoritesManager } from "./favorites";
import { ProfileMenu } from "./ProfileMenu";
import { useCustomerQuery } from "@/features/customers/queries";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";
import { usePoliciesQuery } from "@/features/billing/queries";
import { useCampaignsQuery, useLeadQuery, usePartnerQuery } from "@/features/growth/queries";

const THEME_EVENT = "crm-theme-change";

function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

type Crumb = { label: string; href?: string };
type RecordKind = "customer" | "plan" | "bundle" | "lead" | "campaign" | "partner" | "policy";
/** A detail page's record, whose name is looked up (and shown as the last crumb) once its query has data. */
type RecordRef = { kind: RecordKind; id: string; fallback: string };

/** Breadcrumb from the nav config, plus the record (if any) whose name ends the trail on detail pages. */
function useBreadcrumb(): { crumbs: Crumb[]; record?: RecordRef } {
  const pathname = usePathname();
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  if (pathname === "/") return { crumbs: [{ label: "Home" }, { label: "Dashboard" }] };
  if (pathname === "/crm/roadmap" || pathname === "/roadmap") {
    return { crumbs: [{ label: "Home", href: "/" }, { label: "Sprint Roadmap & PRDs" }] };
  }

  const match = matchNav(pathname);
  if (!match) return { crumbs: [...crumbs, { label: "Not found" }] };
  const leafLabel = match.leaf?.label ?? match.group.title;
  // Skip the group crumb when the leaf has the same name (Partners › Partners).
  if (match.leaf && match.group.title !== leafLabel) crumbs.push({ label: match.group.title });
  // Single-link groups outside Daily Operations show their sidebar section.
  if (!match.leaf && match.group.href && match.section !== "Daily Operations") crumbs.push({ label: match.section });
  if (match.folder) crumbs.push({ label: match.folder.label });

  const rest = pathname.slice(match.href.length).split("/").filter(Boolean);
  if (rest.length === 0) return { crumbs: [...crumbs, { label: leafLabel }] };
  crumbs.push({ label: leafLabel, href: match.href });

  // Detail / editor pages under a list.
  const [first, second] = rest;
  const id = decodeURIComponent(first);
  const label = (text: string) => ({ crumbs: [...crumbs, { label: text }] });
  const record = (kind: RecordKind, recordId: string, fallback = recordId) => ({ crumbs, record: { kind, id: recordId, fallback } });
  if (match.href === "/crm/customer-mgt/customers") return record("customer", id, `#${id}`);
  if (first === "plans") {
    if (!second) return label(id);
    return second === "new" ? label("New plan") : record("plan", decodeURIComponent(second));
  }
  if (match.href === "/crm/catalogue/bundles") return first === "new" ? label("New bundle") : record("bundle", id);
  if (match.href === "/crm/growth/leads") return record("lead", id);
  if (match.href === "/crm/growth/campaigns") return first === "new" ? label("New campaign") : record("campaign", id);
  if (match.href === "/crm/growth/partners") return record("partner", id);
  if (match.href === "/crm/billing/dunning") return first === "new" ? label("New policy") : record("policy", id);
  return label(id);
}

/*
 * Record names come from the same queries the detail pages use, so they share the cache. Only the hook for the
 * current page's record runs; while it loads, or if it fails, the crumb shows the raw id.
 */
type NameProps = { id: string; fallback: string; children: (label: string) => ReactNode };
const CustomerName = ({ id, fallback, children }: NameProps) => <>{children(useCustomerQuery(id).data?.company ?? fallback)}</>;
const LeadName = ({ id, fallback, children }: NameProps) => <>{children(useLeadQuery(id).data?.company ?? fallback)}</>;
const PartnerName = ({ id, fallback, children }: NameProps) => <>{children(usePartnerQuery(id).data?.name ?? fallback)}</>;
function PlanName({ id, fallback, children }: NameProps) {
  const name = usePlansQuery().data?.find((p) => p.code === id)?.name;
  return <>{children(name ? `${name} (${id})` : fallback)}</>;
}
const BundleName = ({ id, fallback, children }: NameProps) => <>{children(useBundlesQuery().data?.find((b) => b.code === id)?.name ?? fallback)}</>;
const CampaignName = ({ id, fallback, children }: NameProps) => <>{children(useCampaignsQuery().data?.find((c) => c.id === id)?.name ?? fallback)}</>;
const PolicyName = ({ id, fallback, children }: NameProps) => <>{children(usePoliciesQuery().data?.find((p) => p.id === id)?.name ?? fallback)}</>;
const RECORD_NAMES: Record<RecordKind, (p: NameProps) => ReactNode> = {
  customer: CustomerName, plan: PlanName, bundle: BundleName, lead: LeadName, campaign: CampaignName, partner: PartnerName, policy: PolicyName,
};

function WithRecordName({ record, children }: { record?: RecordRef; children: (label?: string) => ReactNode }) {
  if (!record) return <>{children()}</>;
  const Name = RECORD_NAMES[record.kind];
  return <Name id={record.id} fallback={record.fallback}>{(name) => children(name)}</Name>;
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const current = crumbs[crumbs.length - 1].label;
  return (
    <>
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
      {current !== "Not found" && (
        <Suspense fallback={null}><FavoriteStar pageLabel={current} /></Suspense>
      )}
    </>
  );
}

export function Header({ onOpenMenu }: { onOpenMenu?: () => void } = {}) {
  const { crumbs, record } = useBreadcrumb();
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
    <header className="h-[70px] bg-[var(--background)] border-b border-[var(--border)] px-4 lg:px-8 gap-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <button type="button" onClick={onOpenMenu} aria-label="Open menu" className="lg:hidden p-2 -ml-2 rounded-md hover:bg-[var(--muted)] shrink-0"><Menu className="w-5 h-5" /></button>

      {/* Breadcrumbs, then the star that pins this page to Favorites */}
      <div className="flex items-center gap-2 min-w-0">
      <WithRecordName key={record ? `${record.kind}:${record.id}` : "none"} record={record}>
        {(name) => <Breadcrumbs crumbs={name === undefined ? crumbs : [...crumbs, { label: name }]} />}
      </WithRecordName>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">

        <a href="/crm-module-map.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[0.85rem] font-semibold bg-[var(--primary)] text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity">
          <Map className="w-4 h-4" /> Module Map
        </a>

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
            <div className={`absolute left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDark ? "translate-x-5" : "translate-x-1"}`} />
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

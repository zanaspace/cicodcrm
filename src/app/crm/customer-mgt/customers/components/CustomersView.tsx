"use client";

import { useUrlFlag } from "@/lib/useUrlFlag";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Download, Plus, ExternalLink, Copy, Ticket, Eye, Users, X } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import {
  LIFECYCLE_STAGES, SEGMENTS, getHealth, monthlyValue, subscriptionLabel, useCustomers,
  type Customer, type SegmentId,
} from "@/lib/mock/customers";
import { BUNDLE_GROUPS, PRODUCTS, useBundles, usePlans } from "@/lib/mock/catalogue";
import { useSectors } from "@/lib/mock/settings";
import { LifecycleProgress } from "./LifecycleProgress";
import { AddCustomerModal } from "./AddCustomerModal";

const ALL_COLUMNS = [
  { id: "customer", label: "Customer" },
  { id: "contact", label: "Primary Contact" },
  { id: "subscription", label: "Bundle / Plan" },
  { id: "lifecycle", label: "Onboarding" },
  { id: "health", label: "Health" },
  { id: "renewal", label: "Next Renewal" },
  { id: "sector", label: "Sector" },
  { id: "businessType", label: "Business Type" },
  { id: "created", label: "Created" },
  { id: "status", label: "Account Status" },
];
const DEFAULT_COLUMNS = ["customer", "subscription", "lifecycle", "health", "renewal"];

const ANY = "All";
const LIFECYCLE_OPTIONS = [ANY, ...LIFECYCLE_STAGES.map((s) => s.label)];
const OFFERING_OPTIONS = [ANY, ...BUNDLE_GROUPS.map((g) => g.name), ...PRODUCTS.map((p) => p.name)];

export function CustomersView() {
  const router = useRouter();
  const SECTOR_OPTIONS = [ANY, ...Object.keys(useSectors())];
  const pathname = usePathname();
  const params = useSearchParams();
  const customers = useCustomers();
  const plans = usePlans();
  const bundles = useBundles();

  const segment = (params.get("segment") as SegmentId) || "all";
  const lifecycle = params.get("lifecycle") || ANY;
  const offering = params.get("offering") || ANY;
  const sector = params.get("sector") || ANY;
  const page = Number(params.get("page") || 1);

  // Search filters instantly from local state; the URL is updated after a short pause.
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [pageSize, setPageSize] = React.useState(10);
  const [activeColumns, setActiveColumns] = React.useState(DEFAULT_COLUMNS);
  const [isAddOpen, setIsAddOpen] = useUrlFlag("new");

  const setParams = React.useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === ANY || (k === "segment" && v === "all") || (k === "page" && v === "1")) next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  React.useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const t = setTimeout(() => setParams({ q: query }), 300);
    return () => clearTimeout(t);
  }, [query, params, setParams]);

  const matchesFilters = React.useCallback((c: Customer) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = [c.company, c.domain, c.cicod, c.email, c.phone, ...c.contacts.map((x) => `${x.name} ${x.email}`)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (lifecycle !== ANY && LIFECYCLE_STAGES.find((s) => s.id === c.lifecycle)?.label !== lifecycle) return false;
    if (offering !== ANY && subscriptionLabel(c.subscription, bundles, plans).group !== offering) return false;
    if (sector !== ANY && c.sector !== sector) return false;
    return true;
  }, [query, lifecycle, offering, sector, bundles, plans]);

  const filtered = React.useMemo(() => customers.filter(matchesFilters), [customers, matchesFilters]);
  const segmentCounts = React.useMemo(
    () => Object.fromEntries(SEGMENTS.map((s) => [s.id, filtered.filter((c) => s.test(c)).length])),
    [filtered],
  );
  const rows = React.useMemo(() => {
    const seg = SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[0];
    return filtered.filter((c) => seg.test(c));
  }, [filtered, segment]);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = !!query || lifecycle !== ANY || offering !== ANY || sector !== ANY;

  const open = (c: Customer, tab?: string) => router.push(`/crm/customer-mgt/customers/${c.cicod}${tab ? `?tab=${tab}` : ""}`);
  const show = (id: string) => activeColumns.includes(id);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Find a customer, check their health and act on renewals, trials and onboarding."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success(`Exported ${rows.length} customer${rows.length === 1 ? "" : "s"} from the current view`)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="default" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Customer</Button>
          </>
        }
      />

      {/* Segments: saved views ops works from every day (style guide "Segments") */}
      <div role="tablist" aria-label="Customer segments" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 overflow-x-auto mb-6">
        {SEGMENTS.map((s) => {
          const active = segment === s.id;
          const count = segmentCounts[s.id] ?? 0;
          const alert = (s.id === "overdue" || s.id === "trial_ending") && count > 0;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ segment: s.id })}
              className={`px-4 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all whitespace-nowrap flex items-center gap-2 ${
                active ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {s.label}
              <span className={`min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold ${
                alert ? "bg-[rgba(239,68,68,.12)] text-[var(--destructive)]" : active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)]/60 text-[var(--muted-foreground)]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        {/* Filters */}
        <div className="p-6 flex items-end justify-between gap-4 flex-wrap border-b border-[var(--border)] bg-[var(--card)] rounded-t-xl">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customer-search" className="text-[0.85rem] font-bold text-[var(--foreground)]">Global Search</label>
              <div className="relative w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input
                  id="customer-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, domain, CICOD #, email or phone"
                  className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)] transition-colors"
                />
              </div>
            </div>
            <FilterSelect label="Onboarding" value={lifecycle} options={LIFECYCLE_OPTIONS} onChange={(v) => setParams({ lifecycle: v })} width="w-[170px]" />
            <FilterSelect label="Bundle group / Product" value={offering} options={OFFERING_OPTIONS} onChange={(v) => setParams({ offering: v })} width="w-[200px]" />
            <FilterSelect label="Sector" value={sector} options={SECTOR_OPTIONS} onChange={(v) => setParams({ sector: v })} width="w-[160px]" searchable />
            {hasFilters && (
              <button
                onClick={() => { setQuery(""); setParams({ q: null, lifecycle: null, offering: null, sector: null }); }}
                className="h-[2.8rem] px-2 text-[0.85rem] font-semibold text-[var(--primary)] hover:text-[var(--accent-foreground)] flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
          <ColumnToggle columns={ALL_COLUMNS} activeColumns={activeColumns} onChange={setActiveColumns} />
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {ALL_COLUMNS.filter((c) => show(c.id)).map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                ))}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={activeColumns.length + 1} className="py-16">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-1"><Users className="w-5 h-5 text-[var(--primary)]" /></div>
                      <p className="font-semibold text-[var(--foreground)]">No customers match this view</p>
                      <p className="text-[0.85rem] text-[var(--muted-foreground)]">Try another segment or clear the filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : pageRows.map((c) => {
                const sub = subscriptionLabel(c.subscription, bundles, plans);
                const health = getHealth(c);
                const contact = c.contacts[0];
                return (
                  <TableRow
                    key={c.cicod}
                    onClick={() => open(c)}
                    className="cursor-pointer group"
                  >
                    {show("customer") && (
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/crm/customer-mgt/customers/${c.cicod}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                          {c.company}
                        </Link>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)] mt-0.5"><span className="font-mono">#{c.cicod}</span> · {contact?.name ?? `${c.domain}.cicod.com`}</div>
                      </TableCell>
                    )}
                    {show("contact") && (
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{contact?.name ?? "—"}</div>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)] mt-0.5">{contact?.email}</div>
                      </TableCell>
                    )}
                    {show("subscription") && (
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium max-w-[240px] truncate" title={`${sub.group} · ${sub.name}`}>{sub.name}</div>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)] mt-0.5 max-w-[240px] truncate">{sub.group} · {formatMoney(monthlyValue(c, bundles, plans))}/mo</div>
                      </TableCell>
                    )}
                    {show("lifecycle") && <TableCell><LifecycleProgress stage={c.lifecycle} /></TableCell>}
                    {show("health") && <TableCell><StatusBadge status={health.id} label={health.label} /></TableCell>}
                    {show("renewal") && (
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{formatDate(c.subscription.trialEndsAt ?? c.subscription.renewsAt)}</div>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)] mt-0.5">{c.subscription.trialEndsAt ? "Trial ends " : ""}{formatRelative(c.subscription.trialEndsAt ?? c.subscription.renewsAt)}</div>
                      </TableCell>
                    )}
                    {show("sector") && <TableCell className="whitespace-nowrap">{c.sector}</TableCell>}
                    {show("businessType") && <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{c.businessType}</TableCell>}
                    {show("created") && <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{formatDate(c.createdAt)}</TableCell>}
                    {show("status") && <TableCell><StatusBadge status={c.status} /></TableCell>}
                    <TableActionsCell>
                      <RowActionsMenu
                        label={`Actions for ${c.company}`}
                        actions={[
                          { label: "Open customer", icon: Eye, onSelect: () => open(c) },
                          { label: "Create ticket", icon: Ticket, onSelect: () => open(c, "tickets") },
                          { label: "Copy CICOD number", icon: Copy, onSelect: () => { navigator.clipboard?.writeText(c.cicod); toast.success(`Copied #${c.cicod}`); } },
                          { label: "Open tenant", icon: ExternalLink, onSelect: () => window.open(`https://${c.domain}.cicod.com`, "_blank", "noopener") },
                        ]}
                      />
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={(p) => setParams({ page: String(p) })}
          onPageSizeChange={(s) => { setPageSize(s); setParams({ page: null }); }}
        />
      </div>

      <AddCustomerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, width, searchable }: { label: string; value: string; options: string[]; onChange: (v: string) => void; width: string; searchable?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}</span>
      <Select ariaLabel={label} value={value} onChange={onChange} options={options} className={`${width} h-[2.8rem]`} searchable={searchable} />
    </div>
  );
}

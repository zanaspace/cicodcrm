"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Download, X, Receipt, Eye, Copy, AlertTriangle, Send, CheckCircle2, XCircle, Clock, Undo2 } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Drawer } from "@/components/ui/Drawer";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { daysUntil, formatMoney } from "@/lib/format";
import { logActivity, subscriptionLabel, useCustomers, type Customer } from "@/lib/mock/customers";
import { useBundles, usePlans } from "@/lib/mock/catalogue";
import { lastAttemptAt, paymentStatus, usePayments, type Payment, type PaymentStatus } from "@/lib/mock/billing";

const ANY = "All";
const STATUSES: PaymentStatus[] = ["Paid", "Failed", "Pending", "Refunded"];
const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
  { label: "All time", days: Infinity },
];
const METHODS = [ANY, "Card", "Bank transfer", "Cash", "Cheque", "POS"];

/** "11 Aug 2026, 16:37" in Lagos time, whatever the source timezone. */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
}

export function PaymentsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const payments = usePayments();
  const customers = useCustomers();
  const plans = usePlans();
  const bundles = useBundles();

  const status = (params.get("status") as PaymentStatus | null) ?? null;
  const group = params.get("group") || ANY;
  const range = params.get("range") || "Last 90 days";
  const method = params.get("method") || ANY;
  const page = Number(params.get("page") || 1);
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [pageSize, setPageSize] = React.useState(25);
  const [openOrder, setOpenOrder] = React.useState<string | null>(null);

  const setParams = React.useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === ANY || (k === "range" && v === "Last 90 days") || (k === "page" && v === "1")) next.delete(k);
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

  const byCicod = React.useMemo(() => new Map(customers.map((c) => [c.cicod, c])), [customers]);
  const groupOf = React.useCallback((p: Payment) => {
    const c = byCicod.get(p.cicod);
    return c ? subscriptionLabel(c.subscription, bundles, plans) : { group: "—", name: "—" };
  }, [byCicod, bundles, plans]);
  const groupOptions = [ANY, ...new Set(customers.map((c) => subscriptionLabel(c.subscription, bundles, plans).group))];

  // Everything except the status chip, so the chips can show counts for the current view.
  const base = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const days = RANGES.find((r) => r.label === range)?.days ?? 90;
    return payments.filter((p) => {
      const c = byCicod.get(p.cicod);
      if (q && ![c?.company, c?.cicod, p.orderId, p.invoiceNo, p.reference].join(" ").toLowerCase().includes(q)) return false;
      if (group !== ANY && groupOf(p).group !== group) return false;
      if (method !== ANY && p.method !== method) return false;
      if (Number.isFinite(days) && -daysUntil(lastAttemptAt(p).slice(0, 10)) > days) return false;
      return true;
    });
  }, [payments, query, group, method, range, byCicod, groupOf]);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, base.filter((p) => paymentStatus(p) === s).length])) as Record<PaymentStatus, number>;
  const sums = Object.fromEntries(STATUSES.map((s) => [s, base.filter((p) => paymentStatus(p) === s).reduce((t, p) => t + p.amount, 0)])) as Record<PaymentStatus, number>;
  const rows = status ? base.filter((p) => paymentStatus(p) === status) : base;
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = !!query || group !== ANY || method !== ANY || range !== "Last 90 days";
  const selected = payments.find((p) => p.orderId === openOrder);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Payments"
        subtitle="Every subscription payment, one row per order. Retries are grouped under the order."
        actions={<Button variant="outline" onClick={() => toast.success(`Exported ${rows.length} orders (${status ?? "all statuses"}, ${range.toLowerCase()})`)}><Download className="w-4 h-4 mr-2" /> Export</Button>}
      />

      {/* Totals for the current filters: they always add up to what the table shows */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {([
          { s: "Paid", label: "Collected", icon: CheckCircle2, tone: "text-[var(--success)] bg-[rgba(31,157,115,.1)]" },
          { s: "Failed", label: "Failed", icon: XCircle, tone: "text-[var(--destructive)] bg-[rgba(239,68,68,.1)]" },
          { s: "Pending", label: "Pending", icon: Clock, tone: "text-[var(--warning)] bg-[rgba(245,158,11,.12)]" },
          { s: "Refunded", label: "Refunded", icon: Undo2, tone: "text-[var(--muted-foreground)] bg-[var(--muted)]" },
        ] as const).map((t) => (
          <button key={t.s} onClick={() => setParams({ status: status === t.s ? null : t.s })} aria-pressed={status === t.s}
            className={cn("text-left bg-[var(--card)] border rounded-xl shadow-sm p-5 flex items-center gap-4 transition-colors hover:border-[var(--primary)]", status === t.s ? "border-[var(--primary)]" : "border-[var(--border)]")}>
            <span className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", t.tone)}><t.icon className="w-5 h-5" /></span>
            <span className="min-w-0">
              <span className="block text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t.label}</span>
              <span className="block font-heading font-extrabold text-[1.35rem] text-[var(--foreground)]">{formatMoney(Math.abs(sums[t.s]))}</span>
              <span className="block text-[0.8rem] text-[var(--muted-foreground)]">{counts[t.s]} order{counts[t.s] === 1 ? "" : "s"}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end gap-4 flex-wrap border-b border-[var(--border)]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay-search" className="text-[0.85rem] font-bold">Global Search</label>
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
              <input id="pay-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Customer, order ID, invoice, reference"
                className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]" />
            </div>
          </div>
          <FilterSelect label="Status" value={status ?? ANY} options={[ANY, ...STATUSES]} onChange={(v) => setParams({ status: v })} width="w-[150px]" />
          <FilterSelect label="Bundle group / Product" value={group} options={groupOptions} onChange={(v) => setParams({ group: v })} width="w-[220px]" />
          <FilterSelect label="Date" value={range} options={RANGES.map((r) => r.label)} onChange={(v) => setParams({ range: v })} width="w-[170px]" />
          <FilterSelect label="Method" value={method} options={METHODS} onChange={(v) => setParams({ method: v })} width="w-[150px]" />
          {(hasFilters || status) && (
            <button onClick={() => { setQuery(""); setParams({ q: null, status: null, group: null, method: null, range: null }); }}
              className="h-[2.8rem] px-2 text-[0.85rem] font-semibold text-[var(--primary)] flex items-center gap-1"><X className="w-4 h-4" /> Clear filters</button>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Customer", "Order / Invoice", "Bundle / Plan", "Amount", "Status", "Last attempt"].map((h) => (
                  <TableHead key={h} className={cn("whitespace-nowrap", h === "Amount" && "text-right")}>{h}</TableHead>
                ))}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Receipt className="w-5 h-5 text-[var(--primary)]" /></div>
                    <p className="font-semibold m-0">No payments match these filters</p>
                    <p className="text-[0.85rem] text-[var(--muted-foreground)] m-0 mt-1">Try a longer date range.</p>
                  </TableCell>
                </TableRow>
              ) : pageRows.map((p) => {
                const c = byCicod.get(p.cicod);
                const st = paymentStatus(p);
                const sub = groupOf(p);
                const tries = p.attempts.length;
                return (
                  <TableRow key={p.orderId} onClick={() => setOpenOrder(p.orderId)} className="cursor-pointer group">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-semibold group-hover:text-[var(--primary)] transition-colors">{c?.company ?? "Unknown"}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)] font-mono">#{p.cicod}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-[0.85rem]">{p.orderId}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)] font-mono">{p.invoiceNo}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{sub.group} · {p.method}{p.recordedBy ? " (recorded)" : ""}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap">{formatMoney(p.amount)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={st} />
                      {tries > 1 && <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-1">{tries} attempts</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{formatDateTime(lastAttemptAt(p))}</TableCell>
                    <TableActionsCell>
                      <RowActionsMenu
                        label={`Actions for order ${p.orderId}`}
                        actions={[
                          { label: "View details", icon: Eye, onSelect: () => setOpenOrder(p.orderId) },
                          { label: "Open customer", icon: Receipt, onSelect: () => router.push(`/crm/customer-mgt/customers/${p.cicod}?tab=billing`) },
                          { label: "Copy order ID", icon: Copy, onSelect: () => { navigator.clipboard?.writeText(p.orderId); toast.success(`Copied ${p.orderId}`); } },
                        ]}
                      />
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={(n) => setParams({ page: String(n) })} onPageSizeChange={(s) => { setPageSize(s); setParams({ page: null }); }} pageSizes={[25, 50, 100]} />
      </div>

      {selected && <PaymentDrawer payment={selected} customer={byCicod.get(selected.cicod)} sub={groupOf(selected)} onClose={() => setOpenOrder(null)} />}
    </div>
  );
}

function PaymentDrawer({ payment: p, customer: c, sub, onClose }: { payment: Payment; customer?: Customer; sub: { group: string; name: string }; onClose: () => void }) {
  const st = paymentStatus(p);
  const overLicence = p.users > p.licences;
  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={`${formatMoney(p.amount)} · ${c?.company ?? p.cicod}`}
      subtitle={<span className="flex items-center gap-2"><StatusBadge status={st} /> Order <span className="font-mono">{p.orderId}</span></span>}
      footer={
        <>
          {st === "Failed" && c && (
            <Button variant="outline" onClick={() => { logActivity(c.cicod, { kind: "invoice", title: "Payment link sent", body: `Link for ${formatMoney(p.amount)} (order ${p.orderId}) sent to ${c.contacts[0]?.email ?? c.email}.` }); toast.success("Payment link sent"); }}>
              <Send className="w-4 h-4 mr-2" /> Send payment link
            </Button>
          )}
          {st === "Paid" && <Button variant="outline" onClick={() => toast.success("Receipt downloaded")}><Download className="w-4 h-4 mr-2" /> Receipt</Button>}
          <Link href={`/crm/customer-mgt/customers/${p.cicod}?tab=billing`}><Button>Open customer</Button></Link>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 m-0 text-[0.9rem]">
        <Fact label="Invoice" value={<span className="font-mono">{p.invoiceNo}</span>} />
        <Fact label="Type" value={p.kind} />
        <Fact label="Bundle / Plan" value={`${sub.group} · ${sub.name}`} wide />
        <Fact label="Billing" value={p.period === "ANNUALLY" ? "Annual" : "Monthly"} />
        <Fact label="Method" value={`${p.method}${p.recordedBy ? ` · recorded by ${p.recordedBy}` : ""}`} />
        <Fact label="Users / licences" value={<span className={overLicence ? "text-[var(--warning)] font-semibold" : ""}>{p.users} of {p.licences}</span>} />
        {p.reference && <Fact label="Reference" value={<span className="font-mono">{p.reference}</span>} />}
      </dl>
      {overLicence && (
        <p className="mt-4 mb-0 flex items-start gap-2 text-[0.85rem] text-[var(--warning)]"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> More users than licences on this invoice. Check the bundle limits.</p>
      )}

      <h3 className="mt-8 mb-4 text-[0.95rem] font-heading font-bold">Attempts</h3>
      <ol className="flex flex-col">
        {[...p.attempts].reverse().map((a, i, arr) => (
          <li key={a.gatewayRef + i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                a.status === "Paid" ? "bg-[rgba(31,157,115,.12)] text-[var(--success)]" : a.status === "Failed" ? "bg-[rgba(239,68,68,.12)] text-[var(--destructive)]" : "bg-[rgba(245,158,11,.12)] text-[var(--warning)]")}>
                {a.status === "Paid" ? <CheckCircle2 className="w-4 h-4" /> : a.status === "Failed" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </span>
              {i < arr.length - 1 && <span className="w-px flex-1 bg-[var(--border)] my-1" />}
            </div>
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{a.status}{a.reason ? ` · ${a.reason}` : ""}</span>
                <span className="text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{formatDateTime(a.at)}</span>
              </div>
              <span className="text-[0.78rem] text-[var(--muted-foreground)] font-mono">{a.gatewayRef}</span>
            </div>
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

function Fact({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", wide && "col-span-2")}>
      <dt className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</dt>
      <dd className="m-0 font-medium truncate">{value}</dd>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, width }: { label: string; value: string; options: string[]; onChange: (v: string) => void; width: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}</span>
      <Select ariaLabel={label} value={value} onChange={onChange} options={options} className={`${width} h-[2.8rem]`} />
    </div>
  );
}

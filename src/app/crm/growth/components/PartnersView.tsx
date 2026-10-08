"use client";

import { useUrlFlag } from "@/lib/useUrlFlag";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Eye, Handshake } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, toE164 } from "@/lib/format";
import { useCountries } from "@/lib/mock/settings";
import { PARTNER_TYPES, PARTNER_TYPE_LABEL, addPartner, partnerEarnings, useCommissionPlans, usePartners, type Partner, type PartnerType } from "@/lib/mock/growth";
import { PartnerDialogs, partnerMenu, type PartnerAction } from "./partnerActions";

const VIEWS = [
  { id: "all", label: "All", test: () => true },
  { id: "queue", label: "Verification queue", test: (p: Partner) => p.status === "Pending" },
  { id: "verified", label: "Verified", test: (p: Partner) => p.status === "Verified" },
  { id: "inactive", label: "Suspended or rejected", test: (p: Partner) => p.status === "Suspended" || p.status === "Rejected" },
];
/** Partner statuses on the shared badge colours. */
export const PARTNER_BADGE: Record<Partner["status"], string> = { Pending: "Pending", Verified: "Active", Suspended: "Suspended", Rejected: "Archived" };

export function PartnersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const partners = usePartners();
  const plans = useCommissionPlans();
  const view = params.get("view") ?? "all";
  const type = params.get("type") ?? "All";
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = useUrlFlag("new");
  const [target, setTarget] = React.useState<{ p: Partner; a: PartnerAction } | null>(null);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if ((k === "view" && v === "all") || (k === "type" && v === "All")) next.delete(k); else next.set(k, v);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const base = partners.filter((p) => (type === "All" || p.type === type) && (!query || `${p.name} ${p.email} ${p.state}`.toLowerCase().includes(query.toLowerCase())));
  const rows = base.filter((VIEWS.find((v) => v.id === view) ?? VIEWS[0]).test).sort((a, b) => (a.status === "Pending" ? -1 : 0) - (b.status === "Pending" ? -1 : 0) || b.joinedAt.localeCompare(a.joinedAt));

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Partners"
        subtitle="ICEs, business partners and delivery partners who sell or deliver for CICOD, and what they earn."
        actions={<Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-2" /> Add partner</Button>}
      />

      <div role="tablist" aria-label="Partner views" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 mb-6">
        {VIEWS.map((v) => {
          const n = base.filter(v.test).length;
          return (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setParam("view", v.id)}
              className={cn("flex-1 justify-center px-4 py-2 rounded-md font-heading font-semibold text-[0.85rem] flex items-center gap-2", view === v.id ? "bg-[var(--card)] shadow-sm text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
              {v.label}<span className={cn("min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold", v.id === "queue" && n ? "bg-[rgba(245,158,11,.15)] text-[var(--warning)]" : "bg-[var(--card)]/60")}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end gap-4 flex-wrap border-b border-[var(--border)]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="partner-search" className="text-[0.85rem] font-bold">Global Search</label>
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
              <input id="partner-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or state"
                className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] font-bold">Partner type</span>
            <Select ariaLabel="Partner type" value={type} onChange={(v) => setParam("type", v)} options={["All", ...PARTNER_TYPES]} className="w-[200px] h-[2.8rem]" />
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Partner", "Status", "Referred customers", "Earned (last 30 days)", "Joined"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Handshake className="w-5 h-5 text-[var(--primary)]" /></div>
                    <p className="font-semibold m-0">No partners in this view</p>
                  </TableCell>
                </TableRow>
              ) : rows.map((p) => {
                const e = partnerEarnings(p, plans);
                return (
                  <TableRow key={p.id} onClick={() => router.push(`/crm/growth/partners/${p.id}`)} className="cursor-pointer group">
                    <TableCell className="whitespace-nowrap">
                      <Link href={`/crm/growth/partners/${p.id}`} onClick={(ev) => ev.stopPropagation()} className="font-semibold group-hover:text-[var(--primary)]">{p.name}</Link>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{PARTNER_TYPE_LABEL[p.type]} · {p.state}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={PARTNER_BADGE[p.status]} label={p.status === "Pending" ? "Pending verification" : p.status} />
                      {p.status === "Pending" && <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-1">{p.documents.length ? `${p.documents.length} document${p.documents.length === 1 ? "" : "s"}` : "No documents yet"}</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.type === "Delivery partner" ? <span className="text-[0.88rem]">{p.deliveries} deliveries</span> : <><div className="font-medium">{p.referred.length}</div><div className="text-[0.8rem] text-[var(--muted-foreground)]">{formatMoney(e.monthly)}/mo of business</div></>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono">{formatMoney(e.earned)}</TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{formatDate(p.joinedAt)}</TableCell>
                    <TableActionsCell>
                      <RowActionsMenu label={`Actions for ${p.name}`} actions={[
                        { label: "Open partner", icon: Eye, onSelect: () => router.push(`/crm/growth/partners/${p.id}`) },
                        ...partnerMenu(p, (a) => setTarget({ p, a })),
                      ]} />
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <PartnerDialogs partner={target?.p ?? null} action={target?.a ?? null} onClose={() => setTarget(null)} />
      <AddPartnerModal isOpen={adding} onClose={() => setAdding(false)} onCreated={(p) => router.push(`/crm/growth/partners/${p.id}`)} />
    </div>
  );
}

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

function AddPartnerModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (p: Partner) => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add partner" maxWidth="max-w-lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="add-partner-form">Add partner</Button></>}>
      {isOpen && <AddPartnerForm onDone={(p) => { onClose(); onCreated(p); }} />}
    </Modal>
  );
}

function AddPartnerForm({ onDone }: { onDone: (p: Partner) => void }) {
  const [v, setV] = React.useState({ name: "", type: "" as PartnerType | "", email: "", phone: "", state: "" });
  const COUNTRIES = useCountries();
  const [error, setError] = React.useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !v.type) return setError("Name and partner type are required");
    if (!/^\S+@\S+\.\S+$/.test(v.email)) return setError("Enter a valid email");
    if (v.phone && !toE164(v.phone)) return setError("Use a Nigerian mobile number, e.g. 0803 123 4567");
    const p = addPartner({ name: v.name.trim(), type: v.type, email: v.email.trim(), phone: toE164(v.phone) ?? "", state: v.state });
    toast.success(`${p.name} added: waiting for verification`);
    onDone(p);
  };
  return (
    <form id="add-partner-form" onSubmit={submit} className="flex flex-col gap-4">
      <p className="m-0 text-[0.85rem] text-[var(--muted-foreground)]">New partners start as Pending. Upload their documents on the partner page, then verify them.</p>
      <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Partner type <span className="text-[var(--destructive)]">*</span></span>
        <Select options={PARTNER_TYPES.map((t) => PARTNER_TYPE_LABEL[t])} value={v.type ? PARTNER_TYPE_LABEL[v.type] : ""} placeholder="Select type" onChange={(l) => setV((x) => ({ ...x, type: PARTNER_TYPES.find((t) => PARTNER_TYPE_LABEL[t] === l)! }))} ariaLabel="Partner type" /></label>
      <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Name <span className="text-[var(--destructive)]">*</span></span><input className={inputClass} value={v.name} onChange={(e) => setV((x) => ({ ...x, name: e.target.value }))} placeholder="Person or company name" /></label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Email <span className="text-[var(--destructive)]">*</span></span><input type="email" className={inputClass} value={v.email} onChange={(e) => setV((x) => ({ ...x, email: e.target.value }))} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Phone</span><input inputMode="tel" className={inputClass} value={v.phone} onChange={(e) => setV((x) => ({ ...x, phone: e.target.value }))} placeholder="0803 123 4567" /></label>
      </div>
      <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">State</span><Select options={COUNTRIES.Nigeria ?? []} value={v.state} onChange={(s) => setV((x) => ({ ...x, state: s }))} placeholder="Select state" searchable ariaLabel="State" /></label>
      {error && <p role="alert" className="m-0 text-[0.85rem] text-[var(--destructive)]">{error}</p>}
    </form>
  );
}

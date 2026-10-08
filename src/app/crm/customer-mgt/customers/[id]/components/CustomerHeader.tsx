"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit2, Ban, Save, Ticket, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { formatDate, formatPhone, toE164 } from "@/lib/format";
import { getHealth, logActivity, updateCustomer, type Customer } from "@/lib/mock/customers";
import { useCountries, useSectors } from "@/lib/mock/settings";

const SUSPEND_REASONS = ["Non-payment", "Customer request", "Fraud or abuse", "Contract ended", "Other"];

export function CustomerHeader({ customer, onCreateTicket }: { customer: Customer; onCreateTicket: () => void }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<"suspend" | "reactivate" | null>(null);
  const health = getHealth(customer);
  const suspended = customer.status === "Suspended";

  const suspend = (r?: { reason: string; note: string }) => {
    updateCustomer(customer.cicod, { status: "Suspended" });
    logActivity(customer.cicod, { kind: "status", title: "Customer suspended", body: `Reason: ${r?.reason}.${r?.note ? ` ${r.note}` : ""}` });
    setConfirm(null);
    toast.success(`${customer.company} suspended`);
  };

  const reactivate = () => {
    updateCustomer(customer.cicod, { status: "Active" });
    logActivity(customer.cicod, { kind: "status", title: "Customer reactivated" });
    setConfirm(null);
    toast.success(`${customer.company} reactivated`);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crm/customer-mgt/customers" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
            <ArrowLeft className="w-4 h-4" /> Customers
          </Link>
          <h1 className="text-2xl font-heading font-extrabold text-[var(--foreground)] m-0 flex items-center gap-3 flex-wrap">
            {customer.company}
            <StatusBadge status={customer.status} />
            {health.id !== "healthy" && health.id !== "suspended" && <StatusBadge status={health.id} label={health.label} />}
          </h1>
          <p className="text-[0.88rem] text-[var(--muted-foreground)] mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono">#{customer.cicod}</span>
            <span aria-hidden>·</span>
            <a href={`https://${customer.domain}.cicod.com`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] inline-flex items-center gap-1">{customer.domain}.cicod.com <ExternalLink className="w-3 h-3" /></a>
            <span aria-hidden>·</span>
            <span>{customer.sector} › {customer.businessType}</span>
            <span aria-hidden>·</span>
            <span>{customer.state}, {customer.country}</span>
            <span aria-hidden>·</span>
            <span>Customer since {formatDate(customer.createdAt)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-7">
          <Button variant="outline" className="h-9" onClick={onCreateTicket}>
            <Ticket className="w-4 h-4 mr-2" /> Create ticket
          </Button>
          <Button variant="outline" className="h-9" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit profile
          </Button>
          <RowActionsMenu
            label="More customer actions"
            triggerClassName="w-9 h-9"
            actions={[
              { label: "Copy CICOD number", icon: Copy, onSelect: () => { navigator.clipboard?.writeText(customer.cicod); toast.success(`Copied #${customer.cicod}`); } },
              { label: "Open tenant", icon: ExternalLink, onSelect: () => window.open(`https://${customer.domain}.cicod.com`, "_blank", "noopener") },
              suspended
                ? { label: "Reactivate customer", icon: RotateCcw, onSelect: () => setConfirm("reactivate") }
                : { label: "Suspend customer", icon: Ban, danger: true, onSelect: () => setConfirm("suspend") },
            ]}
          />
        </div>
      </div>

      <EditCustomerModal customer={customer} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />

      <ConfirmDialog
        isOpen={confirm === "suspend"}
        onClose={() => setConfirm(null)}
        onConfirm={suspend}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={`Suspend ${customer.company}?`}
        description={<>Their workspace <b>{customer.domain}.cicod.com</b> stops working straight away. You can reactivate it later from this page.</>}
        impact={[`${customer.subscription.users} user${customer.subscription.users === 1 ? "" : "s"} lose access to all CICOD apps`, "Billing pauses until the customer is reactivated", "The reason is saved in Activity & Notes"]}
        reasons={SUSPEND_REASONS}
        confirmLabel={`Suspend ${customer.company}`}
      />
      <ConfirmDialog
        isOpen={confirm === "reactivate"}
        onClose={() => setConfirm(null)}
        onConfirm={reactivate}
        icon={<RotateCcw className="w-6 h-6" />}
        title={`Reactivate ${customer.company}?`}
        description="Users get access again immediately and billing resumes on the current plan."
        confirmLabel="Reactivate"
      />
    </>
  );
}

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

function EditCustomerModal({ customer, isOpen, onClose }: { customer: Customer; isOpen: boolean; onClose: () => void }) {
  // Remount the form each time it opens so it starts from the saved values.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit customer profile"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-customer-form"><Save className="w-4 h-4 mr-2" /> Save changes</Button>
        </>
      }
    >
      {isOpen && <EditCustomerForm customer={customer} onClose={onClose} />}
    </Modal>
  );
}

function EditCustomerForm({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const SECTORS = useSectors();
  const COUNTRIES = useCountries();
  const [v, setV] = useState({
    company: customer.company, sector: customer.sector, businessType: customer.businessType,
    email: customer.email, phone: formatPhone(customer.phone), country: customer.country, state: customer.state, address: customer.address,
  });
  const [error, setError] = useState("");
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = v.phone ? toE164(v.phone) : "";
    if (phone === null) return setError("Use a Nigerian mobile number, e.g. 0803 123 4567");
    if (!v.company.trim()) return setError("Company name is required");
    updateCustomer(customer.cicod, { ...v, company: v.company.trim(), phone });
    logActivity(customer.cicod, { kind: "note", title: "Profile updated" });
    toast.success("Customer profile updated");
    onClose();
  };

  return (
    <form id="edit-customer-form" onSubmit={save}>
      <div className="grid grid-cols-2 gap-5">
        <L label="Company name"><input className={inputClass} value={v.company} onChange={(e) => set("company", e.target.value)} /></L>
        <L label="Business email"><input type="email" className={inputClass} value={v.email} onChange={(e) => set("email", e.target.value)} /></L>
        <L label="Sector"><Select options={Object.keys(SECTORS)} value={v.sector} onChange={(s) => { set("sector", s); set("businessType", ""); }} searchable ariaLabel="Sector" /></L>
        <L label="Business type"><Select options={SECTORS[v.sector] ?? []} value={v.businessType} onChange={(s) => set("businessType", s)} placeholder="Select business type" ariaLabel="Business type" /></L>
        <L label="Business phone"><input inputMode="tel" className={inputClass} value={v.phone} onChange={(e) => { set("phone", e.target.value); setError(""); }} placeholder="0803 123 4567" /></L>
        <div />
        <L label="Country"><Select options={Object.keys(COUNTRIES)} value={v.country} onChange={(c) => { set("country", c); set("state", ""); }} searchable ariaLabel="Country" /></L>
        <L label="State"><Select options={COUNTRIES[v.country] ?? []} value={v.state} onChange={(s) => set("state", s)} placeholder="Select state" searchable ariaLabel="State" /></L>
        <div className="col-span-2"><L label="Address"><input className={inputClass} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Building number, street and area" /></L></div>
      </div>
      {error && <p role="alert" className="mt-4 text-[0.85rem] text-[var(--destructive)]">{error}</p>}
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}</label>
      {children}
    </div>
  );
}

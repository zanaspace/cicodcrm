"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Banknote, CalendarPlus, Eye, PauseCircle, PlayCircle, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { daysFromToday, formatDate, formatMoney } from "@/lib/format";
import { monthlyValue, type Customer } from "@/lib/mock/customers";
import { usePaymentMethods } from "@/lib/mock/settings";
import {
  extendDueDate, pauseDunning, recordOfflinePayment, resumeDunning, sendReminder, suspendForNonPayment,
  type DunningState, type PaymentMethod,
} from "@/lib/mock/billing";

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}</span>
      {children}
      {hint && <span className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</span>}
    </label>
  );
}

function Chips({ options, value, onChange }: { options: number[]; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-2" role="radiogroup">
      {options.map((d) => (
        <button key={d} type="button" role="radio" aria-checked={value === d} onClick={() => onChange(d)}
          className={cn("px-4 h-9 rounded-full border-[1.5px] text-[0.85rem] font-semibold", value === d ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-[var(--border)]")}>
          {d} days
        </button>
      ))}
    </div>
  );
}

/* ---------------- Record offline payment ---------------- */

export function RecordPaymentModal({ customer, isOpen, onClose }: { customer: Customer; isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record payment · ${customer.company}`}
      maxWidth="max-w-lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="record-payment-form"><Banknote className="w-4 h-4 mr-2" /> Record payment</Button></>}
    >
      {isOpen && <RecordPaymentForm customer={customer} onDone={onClose} />}
    </Modal>
  );
}

function RecordPaymentForm({ customer, onDone }: { customer: Customer; onDone: () => void }) {
  const due = customer.subscription.period === "ANNUALLY" ? monthlyValue(customer) * 12 : monthlyValue(customer);
  const [amount, setAmount] = React.useState(String(due));
  const methods = usePaymentMethods();
  const [method, setMethod] = React.useState<PaymentMethod>("Bank transfer");
  const [reference, setReference] = React.useState("");
  const [paidOn, setPaidOn] = React.useState(daysFromToday(0));
  const [error, setError] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/,/g, ""));
    if (!value || value <= 0) return setError("Enter the amount received");
    if (methods.find((m) => m.id === method)?.requiresReference && !reference.trim()) return setError(`Add the ${method.toLowerCase()} reference so finance can reconcile it`);
    recordOfflinePayment(customer, { amount: value, method, reference: reference.trim(), paidOn });
    toast.success(`${formatMoney(value)} recorded for ${customer.company}`);
    onDone();
  };

  return (
    <form id="record-payment-form" onSubmit={submit} className="flex flex-col gap-5">
      <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">
        For money received outside the card gateway. It closes the current dunning cycle and moves the next renewal forward by one {customer.subscription.period === "ANNUALLY" ? "year" : "month"}.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Amount (₦)" hint={`Invoice due: ${formatMoney(due)}`}>
          <input inputMode="decimal" className={cn(inputClass, "font-mono")} value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        </Field>
        <Field label="Date received">
          <input type="date" max={daysFromToday(0)} className={inputClass} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </Field>
        <Field label="Method">
          <Select options={methods.filter((m) => m.enabled && !m.online).map((m) => m.id)} value={method} onChange={(m) => { setMethod(m as PaymentMethod); setError(""); }} ariaLabel="Method" />
        </Field>
        <Field label="Reference" hint={methods.find((m) => m.id === method)?.requiresReference ? "Required for this method" : "Optional for this method"}>
          <input className={cn(inputClass, "font-mono")} value={reference} onChange={(e) => { setReference(e.target.value); setError(""); }} placeholder="e.g. FT2410071234" />
        </Field>
      </div>
      {error && <p role="alert" className="m-0 text-[0.85rem] text-[var(--destructive)]">{error}</p>}
    </form>
  );
}

/* ---------------- Extend / pause ---------------- */

const EXTEND_REASONS = ["Customer promised to pay", "Bank delay", "Goodwill gesture", "Invoice was wrong", "Other"];
const PAUSE_REASONS = ["Billing dispute", "Key account (handled by account manager)", "Offline payment expected", "Other"];

function DaysReasonModal({ isOpen, onClose, title, description, reasons, onConfirm, confirmLabel, preview }: {
  isOpen: boolean; onClose: () => void; title: string; description: string; reasons: string[]; confirmLabel: string;
  onConfirm: (days: number, reason: string) => void; preview: (days: number) => string;
}) {
  const [days, setDays] = React.useState(7);
  const [reason, setReason] = React.useState("");
  const close = () => { setReason(""); setDays(7); onClose(); };
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      maxWidth="max-w-md"
      footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!reason} onClick={() => { onConfirm(days, reason); close(); }}>{confirmLabel}</Button></>}
    >
      <div className="flex flex-col gap-5">
        <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">{description}</p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">How long?</span>
          <Chips options={[7, 14, 30]} value={days} onChange={setDays} />
          <span className="text-[0.8rem] text-[var(--info)] font-semibold">{preview(days)}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Reason <span className="text-[var(--destructive)]">*</span></span>
          <Select options={reasons} value={reason} onChange={setReason} placeholder="Select a reason" ariaLabel="Reason" />
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Row menu used by Collections ---------------- */

export function CollectionActions({ customer, state }: { customer: Customer; state: DunningState }) {
  const router = useRouter();
  const [open, setOpen] = React.useState<null | "pay" | "extend" | "pause" | "suspend">(null);
  const paused = state.stage === "paused";

  return (
    <>
      <RowActionsMenu
        label={`Billing actions for ${customer.company}`}
        actions={[
          { label: "Open customer", icon: Eye, onSelect: () => router.push(`/crm/customer-mgt/customers/${customer.cicod}?tab=billing`) },
          { label: "Send reminder now", icon: Send, onSelect: () => { sendReminder(customer); toast.success(`Reminder sent to ${customer.company}`); } },
          { label: "Record offline payment", icon: Banknote, onSelect: () => setOpen("pay") },
          { label: "Extend due date", icon: CalendarPlus, onSelect: () => setOpen("extend") },
          paused
            ? { label: "Resume dunning", icon: PlayCircle, onSelect: () => { resumeDunning(customer); toast.success("Dunning resumed"); } }
            : { label: "Pause dunning", icon: PauseCircle, onSelect: () => setOpen("pause") },
          { label: "Suspend customer", icon: Ban, danger: true, onSelect: () => setOpen("suspend") },
        ]}
      />
      <RecordPaymentModal customer={customer} isOpen={open === "pay"} onClose={() => setOpen(null)} />
      <DaysReasonModal
        isOpen={open === "extend"} onClose={() => setOpen(null)}
        title={`Extend due date · ${customer.company}`}
        description="Moves the renewal date forward. Reminders restart from the new date."
        reasons={EXTEND_REASONS} confirmLabel="Extend due date"
        preview={(d) => `New due date: ${formatDate(daysFromToday(-state.daysPastDue + d))}`}
        onConfirm={(d, r) => { extendDueDate(customer, d, r); toast.success(`Due date extended by ${d} days`); }}
      />
      <DaysReasonModal
        isOpen={open === "pause"} onClose={() => setOpen(null)}
        title={`Pause dunning · ${customer.company}`}
        description="No reminders are sent and the customer won't be suspended while paused."
        reasons={PAUSE_REASONS} confirmLabel="Pause dunning"
        preview={(d) => `Resumes automatically on ${formatDate(daysFromToday(d))}`}
        onConfirm={(d, r) => { pauseDunning(customer, d, r); toast.success(`Dunning paused for ${d} days`); }}
      />
      <ConfirmDialog
        isOpen={open === "suspend"}
        onClose={() => setOpen(null)}
        onConfirm={(r) => { suspendForNonPayment(customer, r?.reason ?? "Non-payment", r?.note ?? ""); setOpen(null); toast.success(`${customer.company} suspended`); }}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={`Suspend ${customer.company}?`}
        description={<>Their workspace <b>{customer.domain}.cicod.com</b> stops working straight away. {state.daysPastDue > 0 ? `Payment is ${state.daysPastDue} days overdue.` : "Payment isn't overdue yet."}</>}
        impact={[`${customer.subscription.users} user${customer.subscription.users === 1 ? "" : "s"} lose access`, "The reason is saved in Activity & Notes"]}
        reasons={["Non-payment", "Customer request", "Fraud or abuse", "Other"]}
        confirmLabel={`Suspend ${customer.company}`}
      />
    </>
  );
}

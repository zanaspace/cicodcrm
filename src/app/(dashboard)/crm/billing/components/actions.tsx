"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Banknote, CalendarPlus, Eye, PauseCircle, PlayCircle, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { daysFromToday, formatDate, formatMoney } from "@/lib/format";
import { usePermissions } from "@/lib/permissions";
import { monthlyValue, type Customer } from "@/lib/mock/customers";
import type { DunningState, PaymentMethod } from "@/lib/mock/billing";
import type { PaymentMethodSetting } from "@/lib/mock/settings";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";
import { usePaymentMethodsQuery } from "@/features/reference/queries";
import { useExtendDueDate, usePauseDunning, useRecordOfflinePayment, useResumeDunning, useSendReminder, useSuspendForNonPayment } from "@/features/billing/queries";

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

/** Shown on controls a role can't use. Hiding is a convenience: the backend still rejects the request. */
export const NO_EDIT = "Your role can view billing but not change it";
export const NO_FULL = "Needs full billing access";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}</span>
      {children}
      {error
        ? <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{error}</span>
        : hint && <span className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</span>}
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
  const { can } = usePermissions();
  const allowed = can("billing", "edit");
  const methods = usePaymentMethodsQuery();
  const record = useRecordOfflinePayment({
    success: (_, { input }) => `${formatMoney(input.amount)} recorded for ${customer.company}`,
    onSuccess: () => onClose(),
  });
  const close = () => { if (record.isPending) return; record.reset(); onClose(); };
  // Whether a reference is mandatory comes from the payment-method settings, so nothing is submitted until they load.
  const ready = methods.isSuccess;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Record payment · ${customer.company}`}
      maxWidth="max-w-lg"
      footer={<>
        <Button variant="outline" onClick={close} disabled={record.isPending}>Cancel</Button>
        <Button type="submit" form="record-payment-form" disabled={!allowed || !ready || record.isPending} title={allowed ? undefined : NO_EDIT}>
          <Banknote className="w-4 h-4 mr-2" /> {record.isPending ? "Saving…" : "Record payment"}
        </Button>
      </>}
    >
      {isOpen && (methods.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-[0.88rem]">
          <p className="m-0 text-[var(--destructive)]">We couldn&apos;t load the payment methods, so this payment can&apos;t be recorded yet.</p>
          <Button variant="outline" size="sm" onClick={() => methods.refetch()}>Try again</Button>
        </div>
      ) : (
        <RecordPaymentForm
          customer={customer}
          methods={methods.data ?? []}
          loading={!ready}
          fieldErrors={record.fieldErrors}
          onSubmit={(input) => { if (allowed && ready) record.run({ cicod: customer.cicod, input }); }}
        />
      ))}
    </Modal>
  );
}

type OfflineInput = { amount: number; method: PaymentMethod; reference: string; paidOn: string };

function RecordPaymentForm({ customer, methods, loading, fieldErrors, onSubmit }: {
  customer: Customer; methods: PaymentMethodSetting[]; loading: boolean; fieldErrors: Record<string, string>; onSubmit: (input: OfflineInput) => void;
}) {
  const bundles = useBundlesQuery().data ?? [];
  const plans = usePlansQuery().data ?? [];
  const monthly = monthlyValue(customer, bundles, plans);
  const due = customer.subscription.period === "ANNUALLY" ? monthly * 12 : monthly;
  // null = untouched: prefilled with the invoice amount, which is only known once the catalogue has loaded.
  const [amount, setAmount] = React.useState<string | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>("Bank transfer");
  const [reference, setReference] = React.useState("");
  const [paidOn, setPaidOn] = React.useState(daysFromToday(0));
  const [error, setError] = React.useState("");
  const amountValue = amount ?? (due ? String(due) : "");
  const requiresReference = methods.find((m) => m.id === method)?.requiresReference;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const value = Number(amountValue.replace(/,/g, ""));
    if (!value || value <= 0) return setError("Enter the amount received");
    if (requiresReference && !reference.trim()) return setError(`Add the ${method.toLowerCase()} reference so finance can reconcile it`);
    onSubmit({ amount: value, method, reference: reference.trim(), paidOn });
  };

  return (
    <form id="record-payment-form" onSubmit={submit} className="flex flex-col gap-5">
      <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">
        For money received outside the card gateway. It closes the current dunning cycle and moves the next renewal forward by one {customer.subscription.period === "ANNUALLY" ? "year" : "month"}.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Amount (₦)" hint={`Invoice due: ${formatMoney(due)}`} error={fieldErrors.amount}>
          <input inputMode="decimal" className={cn(inputClass, "font-mono")} value={amountValue} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        </Field>
        <Field label="Date received" error={fieldErrors.paidOn}>
          <input type="date" max={daysFromToday(0)} className={inputClass} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </Field>
        <Field label="Method" hint={loading ? "Loading methods…" : undefined} error={fieldErrors.method}>
          <Select options={methods.filter((m) => m.enabled && !m.online).map((m) => m.id)} value={method} onChange={(m) => { setMethod(m as PaymentMethod); setError(""); }} ariaLabel="Method" />
        </Field>
        <Field label="Reference" hint={requiresReference ? "Required for this method" : "Optional for this method"} error={fieldErrors.reference}>
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

function DaysReasonModal({ isOpen, onClose, title, description, reasons, onConfirm, confirmLabel, preview, pending, fieldErrors = {} }: {
  isOpen: boolean; onClose: () => void; title: string; description: string; reasons: string[]; confirmLabel: string;
  onConfirm: (days: number, reason: string) => void; preview: (days: number) => string; pending: boolean; fieldErrors?: Record<string, string>;
}) {
  const [days, setDays] = React.useState(7);
  const [reason, setReason] = React.useState("");
  // Start fresh each time it opens; it closes on success (parent) or Cancel.
  const [wasOpen, setWasOpen] = React.useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) { setDays(7); setReason(""); }
  }
  const close = () => { if (!pending) onClose(); };
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      maxWidth="max-w-md"
      footer={<>
        <Button variant="outline" onClick={close} disabled={pending}>Cancel</Button>
        <Button disabled={!reason || pending} onClick={() => onConfirm(days, reason)}>{pending ? "Saving…" : confirmLabel}</Button>
      </>}
    >
      <div className="flex flex-col gap-5">
        <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">{description}</p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">How long?</span>
          <Chips options={[7, 14, 30]} value={days} onChange={setDays} />
          <span className="text-[0.8rem] text-[var(--info)] font-semibold">{preview(days)}</span>
          {fieldErrors.days && <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{fieldErrors.days}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Reason <span className="text-[var(--destructive)]">*</span></span>
          <Select options={reasons} value={reason} onChange={setReason} placeholder="Select a reason" ariaLabel="Reason" />
          {fieldErrors.reason && <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{fieldErrors.reason}</span>}
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Row menu used by Collections ---------------- */

export function CollectionActions({ customer, state }: { customer: Customer; state: DunningState }) {
  const router = useRouter();
  const { can } = usePermissions();
  const canEdit = can("billing", "edit");
  const canFull = can("billing", "full");
  const [open, setOpen] = React.useState<null | "pay" | "extend" | "pause" | "suspend">(null);
  const paused = state.stage === "paused";
  const done = () => setOpen(null);

  const remind = useSendReminder({ success: `Reminder sent to ${customer.company}` });
  const resume = useResumeDunning({ success: "Dunning resumed" });
  const extend = useExtendDueDate({ success: (_, { days }) => `Due date extended by ${days} days`, onSuccess: done });
  const pause = usePauseDunning({ success: (_, { days }) => `Dunning paused for ${days} days`, onSuccess: done });
  const suspend = useSuspendForNonPayment({ success: `${customer.company} suspended`, onSuccess: done });

  const editHint = canEdit ? undefined : NO_EDIT;
  return (
    <>
      <RowActionsMenu
        label={`Billing actions for ${customer.company}`}
        actions={[
          { label: "Open customer", icon: Eye, onSelect: () => router.push(`/crm/customer-mgt/customers/${customer.cicod}?tab=billing`) },
          { label: remind.isPending ? "Sending…" : "Send reminder now", icon: Send, disabled: !canEdit || remind.isPending, hint: editHint, onSelect: () => remind.run({ cicod: customer.cicod }) },
          { label: "Record offline payment", icon: Banknote, disabled: !canEdit, hint: editHint, onSelect: () => setOpen("pay") },
          { label: "Extend due date", icon: CalendarPlus, disabled: !canEdit, hint: editHint, onSelect: () => setOpen("extend") },
          paused
            ? { label: resume.isPending ? "Resuming…" : "Resume dunning", icon: PlayCircle, disabled: !canEdit || resume.isPending, hint: editHint, onSelect: () => resume.run({ cicod: customer.cicod }) }
            : { label: "Pause dunning", icon: PauseCircle, disabled: !canEdit, hint: editHint, onSelect: () => setOpen("pause") },
          { label: "Suspend customer", icon: Ban, danger: true, disabled: !canFull, hint: canFull ? undefined : NO_FULL, onSelect: () => setOpen("suspend") },
        ]}
      />
      <RecordPaymentModal customer={customer} isOpen={open === "pay"} onClose={done} />
      <DaysReasonModal
        isOpen={open === "extend"} onClose={() => { extend.reset(); done(); }}
        title={`Extend due date · ${customer.company}`}
        description="Moves the renewal date forward. Reminders restart from the new date."
        reasons={EXTEND_REASONS} confirmLabel="Extend due date"
        preview={(d) => `New due date: ${formatDate(daysFromToday(-state.daysPastDue + d))}`}
        pending={extend.isPending} fieldErrors={extend.fieldErrors}
        onConfirm={(d, r) => { if (canEdit) extend.run({ cicod: customer.cicod, days: d, reason: r }); }}
      />
      <DaysReasonModal
        isOpen={open === "pause"} onClose={() => { pause.reset(); done(); }}
        title={`Pause dunning · ${customer.company}`}
        description="No reminders are sent and the customer won't be suspended while paused."
        reasons={PAUSE_REASONS} confirmLabel="Pause dunning"
        preview={(d) => `Resumes automatically on ${formatDate(daysFromToday(d))}`}
        pending={pause.isPending} fieldErrors={pause.fieldErrors}
        onConfirm={(d, r) => { if (canEdit) pause.run({ cicod: customer.cicod, days: d, reason: r }); }}
      />
      <ConfirmDialog
        isOpen={open === "suspend"}
        onClose={() => { if (!suspend.isPending) done(); }}
        onConfirm={(r) => { if (canFull) suspend.run({ cicod: customer.cicod, reason: r?.reason ?? "Non-payment", note: r?.note ?? "" }); }}
        pending={suspend.isPending}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={`Suspend ${customer.company}?`}
        description={<>Their workspace <b>{customer.domain}.cicod.com</b> stops working straight away. {state.daysPastDue > 0 ? `Payment is ${state.daysPastDue} days overdue.` : "Payment isn't overdue yet."}</>}
        impact={[`${customer.subscription.users} user${customer.subscription.users === 1 ? "" : "s"} lose access`, "The reason is saved in Activity & Notes"]}
        reasons={["Non-payment", "Customer request", "Fraud or abuse", "Other"]}
        confirmLabel={suspend.isPending ? "Saving…" : `Suspend ${customer.company}`}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { Pencil, Coins, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { formatDate, formatMoney } from "@/lib/format";
import { usePayments } from "@/lib/mock/billing";
import {
  PARTNER_TYPE_LABEL, UNIT_LABEL, commissionExample, describeCommission, partnerEarnings, updateCommissionPlan, useCommissionPlans, usePartners,
  type CommissionPlan, type CommissionUnit,
} from "@/lib/mock/growth";

export function CommissionView() {
  const plans = useCommissionPlans();
  const partners = usePartners();
  usePayments();
  const [editing, setEditing] = React.useState<CommissionPlan | null>(null);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Commission plans" subtitle="What each type of partner earns. Every value shows its unit and a worked example." />
      <Alert tone="info" title="Units are now explicit" className="mb-6">
        The old CRM stored &ldquo;PERCENT 0.3&rdquo; with no unit. Here each plan says exactly what the number means, so payouts can be checked.
      </Alert>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
        {plans.map((plan) => {
          const onPlan = partners.filter((p) => p.type === plan.partnerType && p.status === "Verified");
          const earned = onPlan.reduce((t, p) => t + partnerEarnings(p, plans).earned, 0);
          return (
            <section key={plan.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-heading font-extrabold text-[1.05rem]">{plan.name}</div>
                  <div className="text-[0.8rem] text-[var(--muted-foreground)]">For {PARTNER_TYPE_LABEL[plan.partnerType]}s</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(plan)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-4">
                <div className="font-heading font-extrabold text-[1.3rem] text-[var(--foreground)]">{plan.unit === "percent" ? `${plan.value}%` : formatMoney(plan.value)}</div>
                <div className="text-[0.85rem]">{describeCommission(plan)}</div>
              </div>
              <p className="m-0 text-[0.82rem] text-[var(--muted-foreground)] flex gap-1.5"><Info className="w-4 h-4 shrink-0" /> {commissionExample(plan)}</p>
              <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 text-[0.82rem]">
                <span><b className="font-heading text-[0.95rem]">{onPlan.length}</b> <span className="text-[var(--muted-foreground)]">verified partners</span></span>
                <span><b className="font-heading text-[0.95rem]">{formatMoney(earned)}</b> <span className="text-[var(--muted-foreground)]">earned, last 30 days</span></span>
              </div>
              <div className="text-[0.75rem] text-[var(--muted-foreground)]">Updated {formatDate(plan.updatedAt)} by {plan.updatedBy}</div>
            </section>
          );
        })}
      </div>
      <EditPlanModal plan={editing} onClose={() => setEditing(null)} partnersOnPlan={editing ? partners.filter((p) => p.type === editing.partnerType && p.status === "Verified").length : 0} />
    </div>
  );
}

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";
const UNITS = Object.keys(UNIT_LABEL) as CommissionUnit[];

function EditPlanModal({ plan, onClose, partnersOnPlan }: { plan: CommissionPlan | null; onClose: () => void; partnersOnPlan: number }) {
  // The confirm is a sibling of the modal (not inside it): the modal's animation leaves a transform that would trap a nested overlay.
  const [pending, setPending] = React.useState<{ unit: CommissionUnit; value: number } | null>(null);
  return (
    <>
      <Modal isOpen={!!plan && !pending} onClose={onClose} title={`Edit ${plan?.name ?? ""}`} maxWidth="max-w-lg" footer={null}>
        {plan && <EditPlanForm key={plan.id} plan={plan} onClose={onClose} onSave={setPending} />}
      </Modal>
      {plan && (
        <ConfirmDialog
          isOpen={!!pending}
          onClose={() => setPending(null)}
          onConfirm={() => { if (pending) updateCommissionPlan(plan.id, pending); setPending(null); onClose(); toast.success("Commission plan updated"); }}
          icon={<Coins className="w-6 h-6" />}
          title="Change what partners earn?"
          description="The new rate applies to payments from today. Earlier payouts don't change."
          impact={[
            `${partnersOnPlan} verified ${PARTNER_TYPE_LABEL[plan.partnerType].toLowerCase()}s are on this plan`,
            `From: ${describeCommission(plan)}`,
            ...(pending ? [`To: ${describeCommission(pending)}`] : []),
          ]}
          confirmLabel="Save plan"
        />
      )}
    </>
  );
}

function EditPlanForm({ plan, onClose, onSave }: { plan: CommissionPlan; onClose: () => void; onSave: (d: { unit: CommissionUnit; value: number }) => void }) {
  const [unit, setUnit] = React.useState<CommissionUnit>(plan.unit);
  const [value, setValue] = React.useState(String(plan.value));
  const n = Number(value);
  const valid = n > 0 && (unit !== "percent" || n <= 50);
  const draft = { unit, value: n };
  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">How is it paid?</span>
        <Select options={UNITS.map((u) => UNIT_LABEL[u])} value={UNIT_LABEL[unit]} onChange={(l) => setUnit(UNITS.find((u) => UNIT_LABEL[u] === l)!)} ariaLabel="Commission unit" /></label>
      <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">{unit === "percent" ? "Percent" : "Amount (₦)"}</span>
        <div className="flex items-center"><input inputMode="decimal" className={inputClass + " font-mono"} value={value} onChange={(e) => setValue(e.target.value)} />{unit === "percent" && <span className="ml-2 font-semibold">%</span>}</div>
        {!valid && <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{unit === "percent" ? "Enter a percent between 0 and 50" : "Enter an amount above 0"}</span>}
      </label>
      {valid && <div className="rounded-lg bg-[var(--accent)] p-4 text-[0.85rem]"><b>{describeCommission(draft)}</b><div className="text-[var(--muted-foreground)] mt-1">{commissionExample(draft)}</div></div>}
      <div className="-mx-6 -mb-6 px-6 py-5 border-t border-[var(--border)] bg-[var(--background)] rounded-b-2xl flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!valid || (unit === plan.unit && n === plan.value)} onClick={() => onSave(draft)}><Coins className="w-4 h-4 mr-2" /> Save plan</Button>
      </div>
    </div>
  );
}

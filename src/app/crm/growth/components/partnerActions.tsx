"use client";

import * as React from "react";
import { BadgeCheck, Ban, RotateCcw, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { setPartnerStatus, type Partner } from "@/lib/mock/growth";

export type PartnerAction = "verify" | "reject" | "suspend" | "reactivate";

/** Menu items for a partner, depending on where it is in verification. */
export function partnerMenu(p: Partner, open: (a: PartnerAction) => void) {
  if (p.status === "Pending") return [
    { label: "Verify partner", icon: BadgeCheck, onSelect: () => open("verify") },
    { label: "Reject application", icon: XCircle, danger: true, onSelect: () => open("reject") },
  ];
  if (p.status === "Verified") return [{ label: "Suspend partner", icon: Ban, danger: true, onSelect: () => open("suspend") }];
  return [{ label: "Reactivate partner", icon: RotateCcw, onSelect: () => open("reactivate") }];
}

/** One set of dialogs for every partner action; verification and rejection always ask first. */
export function PartnerDialogs({ partner: p, action, onClose }: { partner: Partner | null; action: PartnerAction | null; onClose: () => void }) {
  if (!p) return null;
  const missingDocs = p.documents.length === 0;
  return (
    <>
      <ConfirmDialog
        isOpen={action === "verify"}
        onClose={onClose}
        onConfirm={() => { setPartnerStatus(p.id, "Verified"); onClose(); toast.success(`${p.name} verified`); }}
        icon={<BadgeCheck className="w-6 h-6" />}
        title={`Verify ${p.name}?`}
        description="Verified partners can refer customers and earn commission."
        impact={[`${p.documents.length} document${p.documents.length === 1 ? "" : "s"} on file${missingDocs ? ": none uploaded yet, check identity another way" : ""}`, `Type: ${p.type}`]}
        confirmLabel="Verify partner"
      />
      <ConfirmDialog
        isOpen={action === "reject"}
        onClose={onClose}
        onConfirm={(r) => { setPartnerStatus(p.id, "Rejected", r?.reason); onClose(); toast.success(`${p.name} rejected`); }}
        tone="danger"
        icon={<XCircle className="w-6 h-6" />}
        title={`Reject ${p.name}?`}
        description="They are told by email and can apply again."
        reasons={["Documents unclear", "Identity not confirmed", "Duplicate application", "Not a fit", "Other"]}
        confirmLabel="Reject application"
      />
      <ConfirmDialog
        isOpen={action === "suspend"}
        onClose={onClose}
        onConfirm={(r) => { setPartnerStatus(p.id, "Suspended", r?.reason); onClose(); toast.success(`${p.name} suspended`); }}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={`Suspend ${p.name}?`}
        description="They stop earning commission until reactivated. Customers they referred are not affected."
        impact={[`${p.referred.length} referred customer${p.referred.length === 1 ? "" : "s"} stay as they are`]}
        reasons={["Policy breach", "Inactive", "Payment dispute", "Partner request", "Other"]}
        confirmLabel="Suspend partner"
      />
      <ConfirmDialog
        isOpen={action === "reactivate"}
        onClose={onClose}
        onConfirm={() => { setPartnerStatus(p.id, "Verified"); onClose(); toast.success(`${p.name} reactivated`); }}
        icon={<RotateCcw className="w-6 h-6" />}
        title={`Reactivate ${p.name}?`}
        description="They can refer customers and earn commission again."
        confirmLabel="Reactivate"
      />
    </>
  );
}

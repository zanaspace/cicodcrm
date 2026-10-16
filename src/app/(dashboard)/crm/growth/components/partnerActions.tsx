"use client";

import * as React from "react";
import { BadgeCheck, Ban, RotateCcw, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Partner, PartnerStatus } from "@/lib/mock/growth";
import { useSetPartnerStatus } from "@/features/growth/queries";

export type PartnerAction = "verify" | "reject" | "suspend" | "reactivate";

/**
 * Menu items for a partner, depending on where it is in verification.
 * Verify, reject, suspend and reactivate need full Partners access (`can("partners", "full")`); pass it as `allowed`.
 */
export function partnerMenu(p: Partner, open: (a: PartnerAction) => void, allowed = true) {
  if (!allowed) return [];
  if (p.status === "Pending") return [
    { label: "Verify partner", icon: BadgeCheck, onSelect: () => open("verify") },
    { label: "Reject application", icon: XCircle, danger: true, onSelect: () => open("reject") },
  ];
  if (p.status === "Verified") return [{ label: "Suspend partner", icon: Ban, danger: true, onSelect: () => open("suspend") }];
  return [{ label: "Reactivate partner", icon: RotateCcw, onSelect: () => open("reactivate") }];
}

/** One set of dialogs for every partner action; verification and rejection always ask first. */
const DONE: Record<PartnerAction, string> = { verify: "verified", reject: "rejected", suspend: "suspended", reactivate: "reactivated" };

export function PartnerDialogs({ partner: p, action, onClose }: { partner: Partner | null; action: PartnerAction | null; onClose: () => void }) {
  const setStatus = useSetPartnerStatus({
    success: () => `${p?.name ?? "Partner"} ${action ? DONE[action] : "updated"}`,
    onSuccess: () => onClose(),
  });
  if (!p) return null;
  const missingDocs = p.documents.length === 0;
  const run = (status: PartnerStatus, reason?: string) => setStatus.run({ id: p.id, status, reason });
  return (
    <>
      <ConfirmDialog
        isOpen={action === "verify"}
        onClose={onClose}
        onConfirm={() => run("Verified")}
        pending={setStatus.isPending}
        icon={<BadgeCheck className="w-6 h-6" />}
        title={`Verify ${p.name}?`}
        description="Verified partners can refer customers and earn commission."
        impact={[`${p.documents.length} document${p.documents.length === 1 ? "" : "s"} on file${missingDocs ? ": none uploaded yet, check identity another way" : ""}`, `Type: ${p.type}`]}
        confirmLabel="Verify partner"
      />
      <ConfirmDialog
        isOpen={action === "reject"}
        onClose={onClose}
        onConfirm={(r) => run("Rejected", r?.reason)}
        pending={setStatus.isPending}
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
        onConfirm={(r) => run("Suspended", r?.reason)}
        pending={setStatus.isPending}
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
        onConfirm={() => run("Verified")}
        pending={setStatus.isPending}
        icon={<RotateCcw className="w-6 h-6" />}
        title={`Reactivate ${p.name}?`}
        description="They can refer customers and earn commission again."
        confirmLabel="Reactivate"
      />
    </>
  );
}

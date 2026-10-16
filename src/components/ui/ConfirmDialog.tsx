"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Label } from "@/components/ui/primitives/label";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: { reason: string; note: string }) => void;
  title: string;
  /** What will happen, in plain words. */
  description: React.ReactNode;
  /** Optional bullet list of side-effects ("Visible on cicod.com pricing", "3 bundles include this plan"). */
  impact?: string[];
  confirmLabel: string;
  tone?: "danger" | "primary";
  /** When set, the user must pick a reason before confirming (kept in the activity log). */
  reasons?: string[];
  icon?: React.ReactNode;
  /**
   * The real request is in flight (e.g. `pending={mutation.isPending}`): the confirm button is disabled and
   * shows the busy state, `onConfirm` is called straight away, and the caller closes the dialog in onSuccess.
   * When omitted, the legacy behaviour is kept (a short simulated busy state before `onConfirm`).
   */
  pending?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, impact, confirmLabel, tone = "primary", reasons, icon, pending }: ConfirmDialogProps) {
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [simulatedBusy, setSimulatedBusy] = React.useState(false);
  const controlled = pending !== undefined;
  const busy = controlled ? pending : simulatedBusy;
  const descriptionId = React.useId();
  const noteId = React.useId();

  const close = () => {
    if (busy) return;
    setReason("");
    setNote("");
    onClose();
  };

  // Clear the reason/note whenever the dialog is closed, including when the caller closes it in onSuccess.
  const [wasOpen, setWasOpen] = React.useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setReason("");
      setNote("");
    }
  }

  const confirm = () => {
    if (busy) return;
    const payload = reasons ? { reason, note } : undefined;
    if (controlled) {
      // Real request: the caller drives the busy state through `pending` and closes the dialog on success.
      onConfirm(payload);
      return;
    }
    // Legacy (no `pending` prop): short simulated busy state, as before.
    setSimulatedBusy(true);
    setTimeout(() => {
      onConfirm(payload);
      setSimulatedBusy(false);
      setReason("");
      setNote("");
    }, 500);
  };

  const blocked = !!reasons && !reason;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      maxWidth="max-w-md"
      ariaDescribedBy={descriptionId}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant={tone === "danger" ? "destructive" : "default"} onClick={confirm} disabled={busy || blocked} className="min-w-[130px]">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Working…</> : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {icon && (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tone === "danger" ? "bg-[rgba(239,68,68,.12)] text-[var(--destructive)]" : "bg-[var(--accent)] text-[var(--primary)]"}`}>
            {icon}
          </div>
        )}
        <div id={descriptionId} className="text-[0.9rem] text-[var(--muted-foreground)] leading-relaxed">{description}</div>

        {impact && impact.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-[0.85rem] text-[var(--foreground)]">
            {impact.map((i) => (
              <li key={i} className="flex gap-2"><span className="text-[var(--primary)]">•</span>{i}</li>
            ))}
          </ul>
        )}

        {reasons && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span aria-hidden className="text-[0.85rem] font-bold text-[var(--foreground)]">Reason <span className="text-[var(--destructive)]">*</span></span>
              <Select options={reasons} value={reason} onChange={setReason} placeholder="Select a reason" ariaLabel="Reason (required)" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={noteId} className="block leading-normal gap-0 text-[0.85rem] font-bold text-[var(--foreground)]">Note <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
              <Textarea
                id={noteId}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Visible in the customer's activity log"
                className="block field-sizing-fixed min-h-0 w-full p-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] dark:bg-[var(--background)] shadow-none text-[0.9rem] md:text-[0.9rem] placeholder:text-[var(--muted-foreground)] focus-visible:ring-0 focus:outline-none focus:border-[var(--ring)] focus-visible:border-[var(--ring)] resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

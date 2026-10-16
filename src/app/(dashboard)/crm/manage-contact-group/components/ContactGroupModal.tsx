"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";
import type { ContactGroupKind, ContactGroupRecord, ContactGroupRecordInput } from "@/lib/mock/contact-groups";
import { CONTACT_GROUP_CONFIG } from "./config";

/** One record of any of the four lists (contact group, type, lifecycle, marketing channel). */
export type ContactGroup = ContactGroupRecord;
export type ContactGroupFormValues = ContactGroupRecordInput;

type Mode = "create" | "edit" | "view";

interface ContactGroupModalProps {
  kind: ContactGroupKind;
  isOpen: boolean;
  mode: Mode;
  record?: ContactGroup | null;
  existing: ContactGroup[];
  onClose: () => void;
  /** Starts the save; the parent closes the modal when it succeeds. */
  onSubmit: (values: ContactGroupFormValues) => void;
  onEdit?: () => void;
  /** True while the save request is in flight. */
  isSaving?: boolean;
  /** Validation messages from the backend, keyed by field. */
  serverErrors?: Record<string, string>;
  /** Hides the Edit button in view mode for users who can't change these lists. */
  canEdit?: boolean;
}

const EMPTY: ContactGroupFormValues = { name: "", key: "", description: "", status: "Active" };

const inputClass =
  "w-full h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-colors";

/** Derive a short key from a name like "UCG_SERVICE" -> "ucg". */
function deriveKey(name: string) {
  return name.trim().split(/[_\s]+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[0.92rem] text-[var(--foreground)]">{children}</div>
    </div>
  );
}

export function ContactGroupModal({ kind, isOpen, mode, record, existing, onClose, onSubmit, onEdit, isSaving = false, serverErrors = {}, canEdit = true }: ContactGroupModalProps) {
  const { label, noun, short } = CONTACT_GROUP_CONFIG[kind];
  const [values, setValues] = React.useState<ContactGroupFormValues>(EMPTY);
  const [keyTouched, setKeyTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ContactGroupFormValues, string>>>({});

  // Reset the form each time the modal opens, from the record being edited.
  const [openedFor, setOpenedFor] = React.useState<string | null>(null);
  const openKey = isOpen ? `${mode}:${record?.id ?? "new"}` : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (openKey) {
      setValues(record ? { name: record.name, key: record.key, description: record.description, status: record.status } : EMPTY);
      setKeyTouched(mode === "edit");
      setErrors({});
    }
  }

  const set = <K extends keyof ContactGroupFormValues>(field: K, value: ContactGroupFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleNameChange = (raw: string) => {
    const name = raw.toUpperCase().replace(/\s+/g, "_");
    setValues((v) => ({ ...v, name, key: keyTouched ? v.key : deriveKey(name) }));
    setErrors((e) => ({ ...e, name: undefined, key: keyTouched ? e.key : undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    const others = existing.filter((s) => s.id !== record?.id);
    if (!values.name.trim()) next.name = `${label} type name is required`;
    else if (others.some((s) => s.name.toLowerCase() === values.name.trim().toLowerCase())) next.name = `A ${noun} with this name already exists`;
    if (!values.key.trim()) next.key = `${label} key is required`;
    else if (!/^[a-z0-9_-]+$/.test(values.key.trim())) next.key = "Use lowercase letters, numbers, - or _ only";
    else if (others.some((s) => s.key === values.key.trim())) next.key = "This key is already in use";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSaving) return;
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    onSubmit({ ...values, name: values.name.trim(), key: values.key.trim(), description: values.description.trim() });
  };

  const nameError = errors.name ?? serverErrors.name;
  const keyError = errors.key ?? serverErrors.key;

  /* ---------- View mode ---------- */
  if (mode === "view" && record) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${label} Details`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            {canEdit && <Button variant="default" onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>}
          </>
        }
      >
        <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-[var(--border)]">
          <div>
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{record.name}</h3>
            <span className="inline-block mt-1.5 font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{record.key}</span>
          </div>
          <Badge variant={record.status === "Active" ? "success" : "destructive"}>{record.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Description" full>{record.description || <span className="text-[var(--muted-foreground)]">—</span>}</Field>
          <Field label="Created By">{record.createdBy}</Field>
          <Field label="Created Time">{record.createdTime}</Field>
          <Field label="Updated By">{record.updatedBy}</Field>
          <Field label="Updated Time">{record.updatedTime}</Field>
        </div>
      </Modal>
    );
  }

  /* ---------- Create / Edit mode ---------- */
  const isEdit = mode === "edit";

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={isEdit ? `Edit ${label}` : `Create ${label}`}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="default" onClick={() => handleSubmit()} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Create"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="svc-name" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            {label} Name <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="svc-name"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. UCG_SERVICE"
            className={`${inputClass} font-mono ${nameError ? "border-[var(--destructive)]" : ""}`}
            autoFocus
          />
          {nameError && <span className="text-[0.75rem] text-[var(--destructive)]">{nameError}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="svc-key" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            {label} Key <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="svc-key"
            value={values.key}
            onChange={(e) => { setKeyTouched(true); set("key", e.target.value.toLowerCase()); }}
            placeholder="e.g. ucg"
            className={`${inputClass} font-mono ${keyError ? "border-[var(--destructive)]" : ""}`}
          />
          {keyError
            ? <span className="text-[0.75rem] text-[var(--destructive)]">{keyError}</span>
            : <span className="text-[0.75rem] text-[var(--muted-foreground)]">Auto-filled from the name. Must be unique.</span>}
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label htmlFor="svc-desc" className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
          <textarea
            id="svc-desc"
            rows={4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={`Briefly describe what this ${short} is for...`}
            className="w-full p-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] resize-none transition-colors"
          />
          {serverErrors.description && <span className="text-[0.75rem] text-[var(--destructive)]">{serverErrors.description}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Status</label>
          <Select
            key={`${isOpen}-${record?.id ?? "new"}`}
            value={values.status}
            onChange={(v) => set("status", v as ContactGroupFormValues["status"])}
            options={["Active", "Inactive"]}
            className="h-10"
          />
        </div>

        {/* Allow Enter to submit */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

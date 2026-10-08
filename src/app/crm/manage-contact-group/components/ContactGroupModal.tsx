"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";

export type ContactGroup = {
  id: string;
  name: string;
  description: string;
  key: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  status: "Active" | "Inactive";
};

export type ContactGroupFormValues = Pick<ContactGroup, "name" | "key" | "description" | "status">;

type Mode = "create" | "edit" | "view";

interface ContactGroupModalProps {
  isOpen: boolean;
  mode: Mode;
  group?: ContactGroup | null;
  existing: ContactGroup[];
  onClose: () => void;
  onSubmit: (values: ContactGroupFormValues) => void;
  onEdit?: () => void;
}

const EMPTY: ContactGroupFormValues = { name: "", key: "", description: "", status: "Active" };

const inputClass =
  "w-full h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-colors";

/** Derive a short group key from a name like "UCG_SERVICE" -> "ucg". */
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

export function ContactGroupModal({ isOpen, mode, group, existing, onClose, onSubmit, onEdit }: ContactGroupModalProps) {
  const [values, setValues] = React.useState<ContactGroupFormValues>(EMPTY);
  const [keyTouched, setKeyTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ContactGroupFormValues, string>>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(group ? { name: group.name, key: group.key, description: group.description, status: group.status } : EMPTY);
    setKeyTouched(mode === "edit");
    setErrors({});
    setIsSaving(false);
  }, [isOpen, group, mode]);

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
    const others = existing.filter((s) => s.id !== group?.id);
    if (!values.name.trim()) next.name = "Contact Group type name is required";
    else if (others.some((s) => s.name.toLowerCase() === values.name.trim().toLowerCase())) next.name = "A contact group with this name already exists";
    if (!values.key.trim()) next.key = "Contact Group key is required";
    else if (!/^[a-z0-9_-]+$/.test(values.key.trim())) next.key = "Use lowercase letters, numbers, - or _ only";
    else if (others.some((s) => s.key === values.key.trim())) next.key = "This key is already in use";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setIsSaving(true);
    // Simulated API latency to match the rest of the app
    setTimeout(() => {
      onSubmit({ ...values, name: values.name.trim(), key: values.key.trim(), description: values.description.trim() });
      setIsSaving(false);
    }, 1200);
  };

  /* ---------- View mode ---------- */
  if (mode === "view" && group) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Contact Group Details"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="default" onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
          </>
        }
      >
        <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-[var(--border)]">
          <div>
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{group.name}</h3>
            <span className="inline-block mt-1.5 font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{group.key}</span>
          </div>
          <Badge variant={group.status === "Active" ? "success" : "destructive"}>{group.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Description" full>{group.description || <span className="text-[var(--muted-foreground)]">—</span>}</Field>
          <Field label="Created By">{group.createdBy}</Field>
          <Field label="Created Time">{group.createdTime}</Field>
          <Field label="Updated By">{group.updatedBy}</Field>
          <Field label="Updated Time">{group.updatedTime}</Field>
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
      title={isEdit ? "Edit Contact Group" : "Create Contact Group"}
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
            Contact Group Name <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="svc-name"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. UCG_SERVICE"
            className={`${inputClass} font-mono ${errors.name ? "border-[var(--destructive)]" : ""}`}
            autoFocus
          />
          {errors.name && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="svc-key" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Contact Group Key <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="svc-key"
            value={values.key}
            onChange={(e) => { setKeyTouched(true); set("key", e.target.value.toLowerCase()); }}
            placeholder="e.g. ucg"
            className={`${inputClass} font-mono ${errors.key ? "border-[var(--destructive)]" : ""}`}
          />
          {errors.key
            ? <span className="text-[0.75rem] text-[var(--destructive)]">{errors.key}</span>
            : <span className="text-[0.75rem] text-[var(--muted-foreground)]">Auto-filled from the name. Must be unique.</span>}
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label htmlFor="svc-desc" className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
          <textarea
            id="svc-desc"
            rows={4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Briefly describe what this group is for..."
            className="w-full p-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] resize-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Status</label>
          <Select
            key={`${isOpen}-${group?.id ?? "new"}`}
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

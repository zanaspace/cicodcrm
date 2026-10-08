"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";

export type BundleGroup = {
  id: string;
  name: string;
  key: string;
  description: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  status: "Active" | "Inactive";
};

export type BundleGroupFormValues = Pick<BundleGroup, "name" | "key" | "description">;

type Mode = "create" | "edit" | "view";

interface BundleGroupModalProps {
  isOpen: boolean;
  mode: Mode;
  bundleGroup?: BundleGroup | null;
  existing: BundleGroup[];
  onClose: () => void;
  onSubmit: (values: BundleGroupFormValues) => void;
  onEdit?: () => void;
}

const EMPTY: BundleGroupFormValues = { name: "", key: "", description: "" };

const inputClass =
  "w-full h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-colors";

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[0.92rem] text-[var(--foreground)]">{children}</div>
    </div>
  );
}

export function BundleGroupModal({ isOpen, mode, bundleGroup, existing, onClose, onSubmit, onEdit }: BundleGroupModalProps) {
  const [values, setValues] = React.useState<BundleGroupFormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof BundleGroupFormValues, string>>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(bundleGroup ? { 
      name: bundleGroup.name, 
      key: bundleGroup.key,
      description: bundleGroup.description
    } : EMPTY);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, bundleGroup, mode]);

  const set = <K extends keyof BundleGroupFormValues>(field: K, value: BundleGroupFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    const others = existing.filter((s) => s.id !== bundleGroup?.id);
    if (!values.name.trim()) next.name = "Name is required";
    if (!values.key.trim()) next.key = "Key is required";
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
    setTimeout(() => {
      onSubmit({ 
        ...values, 
        name: values.name.trim(), 
        key: values.key.trim(),
        description: values.description.trim() 
      });
      setIsSaving(false);
    }, 1200);
  };

  /* ---------- View mode ---------- */
  if (mode === "view" && bundleGroup) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Bundle Group Details"
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
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{bundleGroup.name}</h3>
            <span className="inline-block mt-1.5 font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{bundleGroup.key}</span>
          </div>
          <Badge variant={bundleGroup.status === "Active" ? "success" : "destructive"}>{bundleGroup.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Description" full>{bundleGroup.description || <span className="text-[var(--muted-foreground)]">—</span>}</Field>
          <Field label="Created By">{bundleGroup.createdBy}</Field>
          <Field label="Created Time">{bundleGroup.createdTime}</Field>
          <Field label="Updated By">{bundleGroup.updatedBy}</Field>
          <Field label="Updated Time">{bundleGroup.updatedTime}</Field>
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
      title={isEdit ? "Edit Bundle Group" : "Create Bundle Group"}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="default" onClick={() => handleSubmit()} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Save"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bg-name" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Bundle Group Name <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="bg-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Enter name"
            className={`${inputClass} ${errors.name ? "border-[var(--destructive)]" : ""}`}
            autoFocus
          />
          {errors.name && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.name}</span>}
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bg-key" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Key <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="bg-key"
            value={values.key}
            onChange={(e) => set("key", e.target.value)}
            placeholder="Enter key"
            className={`${inputClass} ${errors.key ? "border-[var(--destructive)]" : ""}`}
          />
          {errors.key && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.key}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bg-desc" className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
          <textarea
            id="bg-desc"
            rows={4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Enter description"
            className="w-full p-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] resize-none transition-colors"
          />
        </div>
        
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

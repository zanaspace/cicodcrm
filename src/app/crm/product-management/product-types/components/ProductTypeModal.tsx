"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";

export type ProductType = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  status: "Active" | "Inactive";
};

export type ProductTypeFormValues = Pick<ProductType, "name" | "description">;

type Mode = "create" | "edit" | "view";

interface ProductTypeModalProps {
  isOpen: boolean;
  mode: Mode;
  productType?: ProductType | null;
  existing: ProductType[];
  onClose: () => void;
  onSubmit: (values: ProductTypeFormValues) => void;
  onEdit?: () => void;
}

const EMPTY: ProductTypeFormValues = { name: "", description: "" };

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

export function ProductTypeModal({ isOpen, mode, productType, existing, onClose, onSubmit, onEdit }: ProductTypeModalProps) {
  const [values, setValues] = React.useState<ProductTypeFormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ProductTypeFormValues, string>>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(productType ? { name: productType.name, description: productType.description } : EMPTY);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, productType, mode]);

  const set = <K extends keyof ProductTypeFormValues>(field: K, value: ProductTypeFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    const others = existing.filter((s) => s.id !== productType?.id);
    if (!values.name.trim()) next.name = "Product type name is required";
    else if (others.some((s) => s.name.toLowerCase() === values.name.trim().toLowerCase())) next.name = "A product type with this name already exists";
    
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
      onSubmit({ ...values, name: values.name.trim(), description: values.description.trim() });
      setIsSaving(false);
    }, 1200);
  };

  /* ---------- View mode ---------- */
  if (mode === "view" && productType) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Product Type Details"
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
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{productType.name}</h3>
          </div>
          <Badge variant={productType.status === "Active" ? "success" : "destructive"}>{productType.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Description" full>{productType.description || <span className="text-[var(--muted-foreground)]">—</span>}</Field>
          <Field label="Created By">{productType.createdBy}</Field>
          <Field label="Created Time">{productType.createdTime}</Field>
          <Field label="Updated By">{productType.updatedBy}</Field>
          <Field label="Updated Time">{productType.updatedTime}</Field>
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
      title={isEdit ? "Edit Product Type" : "Create Product Type"}
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
          <label htmlFor="pt-name" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Product Type <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="pt-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Enter product type name"
            className={`${inputClass} ${errors.name ? "border-[var(--destructive)]" : ""}`}
            autoFocus
          />
          {errors.name && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pt-desc" className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
          <textarea
            id="pt-desc"
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

"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";

export type Product = {
  id: string;
  code: string;
  name: string;
  description: string;
  productType: string;
  serviceType: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  status: "Active" | "Inactive";
};

export type ProductFormValues = Pick<Product, "code" | "name" | "description" | "productType" | "serviceType">;

type Mode = "create" | "edit" | "view";

interface ProductModalProps {
  isOpen: boolean;
  mode: Mode;
  product?: Product | null;
  existing: Product[];
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
  onEdit?: () => void;
}

const EMPTY: ProductFormValues = { code: "", name: "", description: "", productType: "software", serviceType: "" };

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

export function ProductModal({ isOpen, mode, product, existing, onClose, onSubmit, onEdit }: ProductModalProps) {
  const [values, setValues] = React.useState<ProductFormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(product ? { 
      code: product.code, 
      name: product.name, 
      description: product.description,
      productType: product.productType,
      serviceType: product.serviceType
    } : EMPTY);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, product, mode]);

  const set = <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    const others = existing.filter((s) => s.id !== product?.id);
    if (!values.code.trim()) next.code = "Product code is required";
    else if (others.some((s) => s.code.toLowerCase() === values.code.trim().toLowerCase())) next.code = "A product with this code already exists";
    
    if (!values.name.trim()) next.name = "Product name is required";
    if (!values.productType) next.productType = "Product type is required";
    if (!values.serviceType) next.serviceType = "Service type is required";
    
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
        code: values.code.trim(),
        name: values.name.trim(), 
        description: values.description.trim() 
      });
      setIsSaving(false);
    }, 1200);
  };

  /* ---------- View mode ---------- */
  if (mode === "view" && product) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Product Details"
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
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{product.name}</h3>
            <span className="inline-block mt-1.5 font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{product.code}</span>
          </div>
          <Badge variant={product.status === "Active" ? "success" : "destructive"}>{product.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Description" full>{product.description || <span className="text-[var(--muted-foreground)]">—</span>}</Field>
          <Field label="Product Type">{product.productType}</Field>
          <Field label="Service Type">{product.serviceType}</Field>
          <Field label="Created By">{product.createdBy}</Field>
          <Field label="Created Time">{product.createdTime}</Field>
          <Field label="Updated By">{product.updatedBy}</Field>
          <Field label="Updated Time">{product.updatedTime}</Field>
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
      title={isEdit ? "Edit Product" : "Create Product"}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="default" onClick={() => handleSubmit()} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Save"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-code" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Product Code <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="p-code"
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
            placeholder="Enter product code"
            className={`${inputClass} ${errors.code ? "border-[var(--destructive)]" : ""}`}
            autoFocus={!isEdit}
            disabled={isEdit}
          />
          {errors.code && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.code}</span>}
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-name" className="text-[0.8rem] font-bold text-[var(--foreground)]">
            Product Name <span className="text-[var(--destructive)]">*</span>
          </label>
          <input
            id="p-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Enter product name"
            className={`${inputClass} ${errors.name ? "border-[var(--destructive)]" : ""}`}
            autoFocus={isEdit}
          />
          {errors.name && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label htmlFor="p-desc" className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
          <textarea
            id="p-desc"
            rows={4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Enter description"
            className="w-full p-3 rounded-md border border-[var(--input)] bg-[var(--card)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] resize-none transition-colors"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Product Type <span className="text-[var(--destructive)]">*</span></label>
          <Select
            value={values.productType}
            onChange={(v) => set("productType", v)}
            options={["Select Product Type", "software", "hardware", "service"]}
            className={`h-10 ${errors.productType ? "border-[var(--destructive)]" : ""}`}
          />
          {errors.productType && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.productType}</span>}
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Service Type <span className="text-[var(--destructive)]">*</span></label>
          <Select
            value={values.serviceType}
            onChange={(v) => set("serviceType", v)}
            options={["Select service type", "COM_SERVICE", "UCG_SERVICE", "IMS_SERVICE", "WFM_SERVICE"]}
            className={`h-10 ${errors.serviceType ? "border-[var(--destructive)]" : ""}`}
          />
          {errors.serviceType && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.serviceType}</span>}
        </div>

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

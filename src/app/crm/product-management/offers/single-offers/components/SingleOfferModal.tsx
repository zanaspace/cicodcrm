"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { Loader2, Pencil } from "lucide-react";

export type SingleOffer = {
  id: string;
  offerCode: string;
  offerName: string;
  product: string;
  tenantType: string;
  subscriptionType: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  webVisibility: boolean;
  status: "Active" | "Inactive";
};

export type SingleOfferFormValues = Pick<SingleOffer, "offerCode" | "offerName" | "product" | "tenantType" | "subscriptionType">;

type Mode = "create" | "edit" | "view";

interface SingleOfferModalProps {
  isOpen: boolean;
  mode: Mode;
  offer?: SingleOffer | null;
  existing: SingleOffer[];
  onClose: () => void;
  onSubmit: (values: SingleOfferFormValues) => void;
  onEdit?: () => void;
}

const EMPTY: SingleOfferFormValues = { offerCode: "", offerName: "", product: "", tenantType: "MERCHANT", subscriptionType: "PER_USER" };

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

export function SingleOfferModal({ isOpen, mode, offer, existing, onClose, onSubmit, onEdit }: SingleOfferModalProps) {
  const [values, setValues] = React.useState<SingleOfferFormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof SingleOfferFormValues, string>>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(offer ? { 
      offerCode: offer.offerCode, 
      offerName: offer.offerName,
      product: offer.product,
      tenantType: offer.tenantType,
      subscriptionType: offer.subscriptionType
    } : EMPTY);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, offer, mode]);

  const set = <K extends keyof SingleOfferFormValues>(field: K, value: SingleOfferFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    const others = existing.filter((s) => s.id !== offer?.id);
    if (!values.offerCode.trim()) next.offerCode = "Offer code is required";
    else if (others.some((s) => s.offerCode.toLowerCase() === values.offerCode.trim().toLowerCase())) next.offerCode = "This offer code already exists";
    
    if (!values.offerName.trim()) next.offerName = "Offer name is required";
    if (!values.product) next.product = "Product is required";
    if (!values.tenantType) next.tenantType = "Tenant Type is required";
    if (!values.subscriptionType) next.subscriptionType = "Subscription Type is required";
    
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
        offerCode: values.offerCode.trim(), 
        offerName: values.offerName.trim()
      });
      setIsSaving(false);
    }, 1200);
  };

  /* ---------- View mode ---------- */
  if (mode === "view" && offer) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Single Offer Details"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="default" onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
          </>
        }
      >
        <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-[var(--border)]">
          <div>
            <h3 className="text-[1.15rem] font-heading font-bold text-[var(--foreground)] m-0">{offer.offerName}</h3>
            <span className="inline-block mt-1.5 font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{offer.offerCode}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
             <Badge variant={offer.status === "Active" ? "success" : "destructive"}>{offer.status}</Badge>
             <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)]">Web Visibility: {offer.webVisibility ? "ON" : "OFF"}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Product">{offer.product}</Field>
          <Field label="Tenant Type">{offer.tenantType}</Field>
          <Field label="Subscription Type">{offer.subscriptionType}</Field>
          <div className="col-span-1" />
          <Field label="Created By">{offer.createdBy}</Field>
          <Field label="Created Time">{offer.createdTime}</Field>
          <Field label="Updated By">{offer.updatedBy}</Field>
          <Field label="Updated Time">{offer.updatedTime}</Field>
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
      title={isEdit ? "Edit Product Offer" : "Create Product Offer"}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="default" onClick={() => handleSubmit()} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Save"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Section 1 */}
        <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--card)]">
           <h4 className="font-bold text-[0.9rem] mb-4 text-[var(--foreground)] border-b border-[var(--border)] pb-2">Product Information</h4>
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Tenant Type <span className="text-[var(--destructive)]">*</span></label>
                <Select
                  value={values.tenantType}
                  onChange={(v) => set("tenantType", v)}
                  options={["MERCHANT", "Financial Service Provider", "Delivery Partner"]}
                  className={`h-10 ${errors.tenantType ? "border-[var(--destructive)]" : ""}`}
                />
                {errors.tenantType && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.tenantType}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Product <span className="text-[var(--destructive)]">*</span></label>
                <Select
                  value={values.product}
                  onChange={(v) => set("product", v)}
                  options={["Select Product", "Unified Collections Gateway", "Customer Order Management", "Workflow Manager", "Inventory Management System"]}
                  className={`h-10 ${errors.product ? "border-[var(--destructive)]" : ""}`}
                />
                {errors.product && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.product}</span>}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="o-code" className="text-[0.8rem] font-bold text-[var(--foreground)]">
                  Product Offer Code <span className="text-[var(--destructive)]">*</span>
                </label>
                <input
                  id="o-code"
                  value={values.offerCode}
                  onChange={(e) => set("offerCode", e.target.value)}
                  placeholder="Enter code"
                  className={`${inputClass} ${errors.offerCode ? "border-[var(--destructive)]" : ""}`}
                  autoFocus={!isEdit}
                  disabled={isEdit}
                />
                {errors.offerCode && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.offerCode}</span>}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="o-name" className="text-[0.8rem] font-bold text-[var(--foreground)]">
                  Product Offer Name <span className="text-[var(--destructive)]">*</span>
                </label>
                <input
                  id="o-name"
                  value={values.offerName}
                  onChange={(e) => set("offerName", e.target.value)}
                  placeholder="Enter name"
                  className={`${inputClass} ${errors.offerName ? "border-[var(--destructive)]" : ""}`}
                />
                {errors.offerName && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.offerName}</span>}
              </div>
           </div>
        </div>

        {/* Section 2 */}
        <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--card)]">
           <h4 className="font-bold text-[0.9rem] mb-4 text-[var(--foreground)] border-b border-[var(--border)] pb-2">Subscription</h4>
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Subscription Type <span className="text-[var(--destructive)]">*</span></label>
                <Select
                  value={values.subscriptionType}
                  onChange={(v) => set("subscriptionType", v)}
                  options={["PER_USER", "PERIODIC"]}
                  className={`h-10 ${errors.subscriptionType ? "border-[var(--destructive)]" : ""}`}
                />
                {errors.subscriptionType && <span className="text-[0.75rem] text-[var(--destructive)]">{errors.subscriptionType}</span>}
              </div>
           </div>
        </div>

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

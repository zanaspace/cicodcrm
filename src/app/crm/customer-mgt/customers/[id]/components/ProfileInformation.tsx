import React from "react";
import { Building2, Phone, Mail, MapPin, Plus } from "lucide-react";
import { formatPhone } from "@/lib/format";
import type { Customer } from "@/lib/mock/customers";

export function ProfileInformation({ customer }: { customer: Customer }) {
  const fields = [
    { label: "Company Name", value: customer.company },
    { label: "Workspace", value: `${customer.domain}.cicod.com` },
    { label: "Business Phone", value: customer.phone ? formatPhone(customer.phone) : "", icon: Phone },
    { label: "Email Address", value: customer.email, icon: Mail },
    { label: "Sector", value: `${customer.sector} › ${customer.businessType}` },
    { label: "Address", value: [customer.address, customer.state, customer.country].filter(Boolean).join(", "), icon: MapPin },
  ];
  // Only show what we know; missing details become a single prompt instead of rows of "-".
  const missing = [!customer.phone && "phone", !customer.address && "street address", "RC number", "bank details"].filter(Boolean) as string[];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--primary)]" /> Profile Information
        </h3>
      </div>
      <div className="p-6 grid grid-cols-3 gap-y-6 gap-x-8">
        {fields.filter((f) => f.value).map((f) => (
          <div key={f.label} className="flex flex-col gap-1 min-w-0">
            <span className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{f.label}</span>
            <span className="text-[0.9rem] font-medium text-[var(--foreground)] flex items-center gap-1.5 truncate" title={f.value}>
              {f.icon && <f.icon className="w-3.5 h-3.5 shrink-0" />}<span className="truncate">{f.value}</span>
            </span>
          </div>
        ))}
      </div>
      {missing.length > 0 && (
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--background)] text-[0.82rem] text-[var(--muted-foreground)] flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
          Not captured yet: {missing.join(", ")}. Use <span className="font-semibold text-[var(--foreground)]">Edit profile</span> to add them.
        </div>
      )}
    </div>
  );
}

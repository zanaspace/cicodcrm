import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPhone, initials } from "@/lib/format";
import type { Customer } from "@/lib/mock/customers";

const ROLE_STYLE = {
  Admin: { badge: "secondary" as const, avatar: "bg-[rgba(242,169,59,0.15)] text-[var(--primary)]" },
  Technical: { badge: "info" as const, avatar: "bg-[rgba(59,130,246,0.15)] text-[var(--info)]" },
  Billing: { badge: "success" as const, avatar: "bg-[rgba(31,157,115,0.15)] text-[var(--success)]" },
};

export function ContactPersons({ customer }: { customer: Customer }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--primary)]" /> Contact Persons
        </h3>
      </div>
      <div className="flex flex-col divide-y divide-[var(--border)]">
        {customer.contacts.map((c) => (
          <div key={c.email + c.role} className="p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-heading shrink-0 ${ROLE_STYLE[c.role].avatar}`}>
              {initials(c.name)}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[0.9rem] font-bold text-[var(--foreground)] flex items-center gap-2">{c.name} <Badge variant={ROLE_STYLE[c.role].badge} className="px-1.5 py-0 text-[0.6rem]">{c.role}</Badge></span>
              </div>
              <a href={`mailto:${c.email}`} className="text-[0.8rem] font-medium text-[var(--foreground)] hover:text-[var(--primary)] flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0 text-[var(--muted-foreground)]"/> <span className="truncate">{c.email}</span></a>
              <span className="text-[0.8rem] font-medium text-[var(--foreground)] flex items-center gap-1.5"><Phone className="w-3 h-3 text-[var(--muted-foreground)]"/> {formatPhone(c.phone)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

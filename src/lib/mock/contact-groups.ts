"use client";

import { createStore } from "@/lib/store";

/**
 * Contact group reference lists (legacy Angular: Marketing › Manage Contact Group, Contact Group Type,
 * Contact Group Lifecycle, Marketing Channel). The four lists share one record shape.
 */
export type ContactGroupKind = "groups" | "types" | "lifecycles" | "channels";

export type ContactGroupRecord = {
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

export type ContactGroupRecordInput = Pick<ContactGroupRecord, "name" | "key" | "description" | "status">;

export const CONTACT_GROUP_STATUSES: ContactGroupRecord["status"][] = ["Active", "Inactive"];

/** Id prefix for new records of each kind, as the prototype pages used. */
export const CONTACT_GROUP_ID_PREFIX: Record<ContactGroupKind, string> = { groups: "cg", types: "cgt", lifecycles: "cgl", channels: "mc" };

/** Formats a date as "DD-MM-YYYY hh:mm AM" to match the rest of the CRM. */
export function formatRecordTime(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

const INITIAL: Record<ContactGroupKind, ContactGroupRecord[]> = {
  groups: [
    { id: "cg-1", name: "VIP Customers", description: "High value customers.", key: "vip_cust", createdBy: "Admin Admin", createdTime: "24-09-2023 06:01 PM", updatedBy: "Adetola Rabiu", updatedTime: "18-02-2024 02:39 PM", status: "Active" },
    { id: "cg-2", name: "Newsletter Subscribers", description: "Weekly newsletter.", key: "news", createdBy: "Admin Admin", createdTime: "24-09-2023 05:59 PM", updatedBy: "Admin Admin", updatedTime: "18-10-2023 12:14 PM", status: "Active" },
    { id: "cg-3", name: "Regional Partners", description: "Partners in West Africa.", key: "reg_part", createdBy: "Admin Admin", createdTime: "24-09-2023 05:54 PM", updatedBy: "Admin Admin", updatedTime: "24-09-2023 06:07 PM", status: "Active" },
    { id: "cg-4", name: "Inbound Leads Q4", description: "Leads generated in Q4.", key: "leads_q4", createdBy: "Admin Admin", createdTime: "24-09-2023 02:12 PM", updatedBy: "Adetola Rabiu", updatedTime: "30-11-2023 02:00 PM", status: "Active" },
  ],
  types: [
    { id: "cgt-1", name: "B2B", description: "Business to business contacts.", key: "b2b", createdBy: "Admin Admin", createdTime: "24-09-2023 06:01 PM", updatedBy: "Adetola Rabiu", updatedTime: "18-02-2024 02:39 PM", status: "Active" },
    { id: "cgt-2", name: "B2C", description: "Business to consumer contacts.", key: "b2c", createdBy: "Admin Admin", createdTime: "24-09-2023 05:59 PM", updatedBy: "Admin Admin", updatedTime: "18-10-2023 12:14 PM", status: "Active" },
    { id: "cgt-3", name: "Partner", description: "Strategic partners and affiliates.", key: "partner", createdBy: "Admin Admin", createdTime: "24-09-2023 05:54 PM", updatedBy: "Admin Admin", updatedTime: "24-09-2023 06:07 PM", status: "Active" },
    { id: "cgt-4", name: "Supplier", description: "Vendors and suppliers.", key: "supplier", createdBy: "Admin Admin", createdTime: "24-09-2023 02:12 PM", updatedBy: "Adetola Rabiu", updatedTime: "30-11-2023 02:00 PM", status: "Active" },
  ],
  lifecycles: [
    { id: "cgl-1", name: "Lead", description: "Initial contact with potential interest.", key: "lead", createdBy: "Admin Admin", createdTime: "24-09-2023 06:01 PM", updatedBy: "Adetola Rabiu", updatedTime: "18-02-2024 02:39 PM", status: "Active" },
    { id: "cgl-2", name: "Prospect", description: "Qualified lead actively engaged.", key: "prospect", createdBy: "Admin Admin", createdTime: "24-09-2023 05:59 PM", updatedBy: "Admin Admin", updatedTime: "18-10-2023 12:14 PM", status: "Active" },
    { id: "cgl-3", name: "Customer", description: "Active paying customer.", key: "customer", createdBy: "Admin Admin", createdTime: "24-09-2023 05:54 PM", updatedBy: "Admin Admin", updatedTime: "24-09-2023 06:07 PM", status: "Active" },
    { id: "cgl-4", name: "Churned", description: "Former customer who cancelled.", key: "churned", createdBy: "Admin Admin", createdTime: "24-09-2023 02:12 PM", updatedBy: "Adetola Rabiu", updatedTime: "30-11-2023 02:00 PM", status: "Active" },
  ],
  channels: [
    { id: "mc-1", name: "Email", description: "Email marketing campaigns.", key: "email", createdBy: "Admin Admin", createdTime: "24-09-2023 06:01 PM", updatedBy: "Adetola Rabiu", updatedTime: "18-02-2024 02:39 PM", status: "Active" },
    { id: "mc-2", name: "SMS", description: "Direct SMS blasts.", key: "sms", createdBy: "Admin Admin", createdTime: "24-09-2023 05:59 PM", updatedBy: "Admin Admin", updatedTime: "18-10-2023 12:14 PM", status: "Active" },
    { id: "mc-3", name: "Push Notifications", description: "Mobile app push notifications.", key: "push", createdBy: "Admin Admin", createdTime: "24-09-2023 05:54 PM", updatedBy: "Admin Admin", updatedTime: "24-09-2023 06:07 PM", status: "Active" },
    { id: "mc-4", name: "Social Media", description: "Paid social ads.", key: "social", createdBy: "Admin Admin", createdTime: "24-09-2023 02:12 PM", updatedBy: "Adetola Rabiu", updatedTime: "30-11-2023 02:00 PM", status: "Active" },
  ],
};

export const contactGroupsStore = createStore<ContactGroupRecord[]>(INITIAL.groups);
export const contactGroupTypesStore = createStore<ContactGroupRecord[]>(INITIAL.types);
export const contactGroupLifecyclesStore = createStore<ContactGroupRecord[]>(INITIAL.lifecycles);
export const marketingChannelsStore = createStore<ContactGroupRecord[]>(INITIAL.channels);

export const CONTACT_GROUP_STORES: Record<ContactGroupKind, typeof contactGroupsStore> = {
  groups: contactGroupsStore,
  types: contactGroupTypesStore,
  lifecycles: contactGroupLifecyclesStore,
  channels: marketingChannelsStore,
};

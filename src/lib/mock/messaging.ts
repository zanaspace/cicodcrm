"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday } from "@/lib/format";

/**
 * One template library shared by Campaigns (Growth) and Dunning policies (Billing).
 * Seeded from the legacy CRM, including its single SMS template whose wording ("Thank you for your order")
 * does not fit the payment reminders it is used for, so the prototype can show that mismatch being caught.
 */

export type Channel = "email" | "sms";
export type TemplateCategory = "Billing" | "Marketing" | "Onboarding" | "Orders";

export type Template = {
  id: string;
  channel: Channel;
  name: string;
  category: TemplateCategory;
  subject?: string;
  body: string;
  updatedAt: string;
  updatedBy: string;
};

export const CATEGORIES: TemplateCategory[] = ["Billing", "Marketing", "Onboarding", "Orders"];

export const VARIABLES = [
  { key: "{contact_name}", label: "Contact first name" },
  { key: "{company}", label: "Company" },
  { key: "{plan}", label: "Bundle or plan" },
  { key: "{amount}", label: "Amount due" },
  { key: "{due_date}", label: "Due date" },
  { key: "{suspend_date}", label: "Suspension date" },
  { key: "{domain}", label: "Workspace domain" },
];

const INITIAL: Template[] = [
  { id: "em-reminder", channel: "email", category: "Billing", name: "Renewal reminder", subject: "Your {plan} renewal is coming up", body: "Hi {contact_name},\n\nYour {plan} subscription renews on {due_date}. We'll charge {amount} to your card on file.\n\nNo action is needed if your details are up to date.", updatedAt: daysFromToday(-40), updatedBy: "Isaac Adegunle" },
  { id: "em-warning", channel: "email", category: "Billing", name: "Renewal warning", subject: "We couldn't take your payment", body: "Hi {contact_name},\n\nWe couldn't take payment of {amount} for {plan}. Please update your card or pay by bank transfer before {due_date} to avoid interruption.", updatedAt: daysFromToday(-40), updatedBy: "Isaac Adegunle" },
  { id: "em-final", channel: "email", category: "Billing", name: "Final notice", subject: "Final notice: {domain}.cicod.com will be suspended", body: "Hi {contact_name},\n\nYour {plan} payment of {amount} is now overdue. Your workspace {domain}.cicod.com will be suspended on {suspend_date} unless payment is received.", updatedAt: daysFromToday(-40), updatedBy: "Isaac Adegunle" },
  { id: "em-upgrade", channel: "email", category: "Marketing", name: "Lyte to Merchant upgrade", subject: "More for {company}: move up from Lyte", body: "Hi {contact_name},\n\n{company} has outgrown Lyte. Move to CICOD Merchant for inventory, delivery tracking and payments in one place. Reply to this email and we'll set it up with you.", updatedAt: daysFromToday(-12), updatedBy: CURRENT_USER },
  { id: "em-welcome", channel: "email", category: "Onboarding", name: "Welcome to CICOD", subject: "Welcome to CICOD, {contact_name}", body: "Hi {contact_name},\n\nYour workspace {domain}.cicod.com is ready. Your first step: add your products. Our team will call you this week to help.", updatedAt: daysFromToday(-60), updatedBy: "Tolu Animashaun" },
  { id: "sms-short", channel: "sms", category: "Billing", name: "Short reminder", body: "CICOD: {plan} renews {due_date} ({amount}). Reply HELP for support.", updatedAt: daysFromToday(-40), updatedBy: "Isaac Adegunle" },
  { id: "sms-broadcast", channel: "sms", category: "Orders", name: "Broadcast message", body: "Dear, Thank you for your order.", updatedAt: daysFromToday(-1415), updatedBy: "Tolu Animashaun" },
  { id: "sms-trial", channel: "sms", category: "Marketing", name: "Trial ending offer", body: "CICOD: Hi {contact_name}, your trial ends soon. Keep {plan} for {amount}/month. Questions? Call 0700 CICOD.", updatedAt: daysFromToday(-5), updatedBy: CURRENT_USER },
];

export const templatesStore = createStore<Template[]>(INITIAL);
export const useTemplates = () => useStore(templatesStore);
export const templateById = (id?: string) => templatesStore.get().find((t) => t.id === id);

export function upsertTemplate(t: Template) {
  templatesStore.set((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev]));
}

/** Fill a template with a recipient's details (or sample values). */
export function fillTemplate(body: string, v: { contactName?: string; company?: string; plan?: string; amount?: string; dueDate?: string; suspendDate?: string; domain?: string }) {
  return body
    .replaceAll("{contact_name}", v.contactName ?? "Adaeze")
    .replaceAll("{company}", v.company ?? "Adaeze Stores")
    .replaceAll("{plan}", v.plan ?? "CICOD Supply Chain Standard")
    .replaceAll("{amount}", v.amount ?? "₦8,000")
    .replaceAll("{due_date}", v.dueDate ?? "14 Oct 2026")
    .replaceAll("{suspend_date}", v.suspendDate ?? "18 Oct 2026")
    .replaceAll("{domain}", v.domain ?? "adaezestores");
}

export const SMS_SEGMENT = 160;

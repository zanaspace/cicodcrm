"use client";

import React, { useState } from "react";
import { StickyNote, Send, CreditCard, Ticket, Flag, UserPlus, ShieldAlert, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { logActivity, type ActivityItem, type Customer } from "@/lib/mock/customers";

const KIND = {
  note: { icon: StickyNote, tone: "bg-[var(--accent)] text-[var(--primary)]" },
  status: { icon: ShieldAlert, tone: "bg-[rgba(239,68,68,.12)] text-[var(--destructive)]" },
  lifecycle: { icon: Flag, tone: "bg-[rgba(59,130,246,.12)] text-[var(--info)]" },
  payment: { icon: CreditCard, tone: "bg-[rgba(31,157,115,.12)] text-[var(--success)]" },
  invoice: { icon: Receipt, tone: "bg-[rgba(31,157,115,.12)] text-[var(--success)]" },
  ticket: { icon: Ticket, tone: "bg-[rgba(245,158,11,.12)] text-[var(--warning)]" },
  created: { icon: UserPlus, tone: "bg-[var(--muted)] text-[var(--muted-foreground)]" },
} satisfies Record<ActivityItem["kind"], { icon: React.ElementType; tone: string }>;

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "notes", label: "Notes", test: (a: ActivityItem) => a.kind === "note" },
  { id: "billing", label: "Billing", test: (a: ActivityItem) => a.kind === "payment" || a.kind === "invoice" },
  { id: "account", label: "Account", test: (a: ActivityItem) => a.kind === "status" || a.kind === "lifecycle" || a.kind === "created" },
  { id: "tickets", label: "Tickets", test: (a: ActivityItem) => a.kind === "ticket" },
];

/** Notes and system events in one timeline, newest first. */
export function ActivityTab({ customer }: { customer: Customer }) {
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const items = customer.activity.filter(FILTERS.find((f) => f.id === filter)!.test);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    const [first, ...rest] = note.trim().split("\n");
    logActivity(customer.cicod, { kind: "note", title: first.slice(0, 80), body: rest.join("\n") || undefined });
    setNote("");
    toast.success("Note added");
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
          <h3 className="text-[0.95rem] font-heading font-bold m-0">Timeline</h3>
          <div className="flex items-center gap-1" role="tablist" aria-label="Filter activity">
            {FILTERS.map((f) => (
              <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className={cn("px-3 py-1 rounded-full text-[0.78rem] font-semibold transition-colors", filter === f.id ? "bg-[var(--secondary)] text-[var(--secondary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]")}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {items.length === 0 ? (
          <p className="p-10 m-0 text-center text-[0.88rem] text-[var(--muted-foreground)]">Nothing here yet.</p>
        ) : (
          <ol className="p-6 flex flex-col">
            {items.map((a, i) => {
              const k = KIND[a.kind];
              return (
                <li key={a.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", k.tone)}><k.icon className="w-4 h-4" /></span>
                    {i < items.length - 1 && <span className="w-px flex-1 bg-[var(--border)] my-1" />}
                  </div>
                  <div className="pb-6 min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-[0.9rem] text-[var(--foreground)]">{a.title}</span>
                      <span className="text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{formatDate(a.at)}</span>
                    </div>
                    {a.body && <p className="m-0 mt-1 text-[0.85rem] text-[var(--muted-foreground)] whitespace-pre-line">{a.body}</p>}
                    <span className="text-[0.75rem] text-[var(--muted-foreground)]">by {a.by}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form onSubmit={submit} className="col-span-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col h-max">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2"><StickyNote className="w-4 h-4 text-[var(--primary)]" /> Add a note</h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <label htmlFor="new-note" className="sr-only">Note</label>
          <textarea
            id="new-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={7}
            placeholder={"First line becomes the title.\nAdd details below it."}
            className="p-4 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] leading-relaxed focus:outline-none focus:border-[var(--ring)] resize-none"
          />
          <Button type="submit" disabled={!note.trim()} className="self-end px-6"><Send className="w-4 h-4 mr-2" /> Add note</Button>
        </div>
      </form>
    </div>
  );
}

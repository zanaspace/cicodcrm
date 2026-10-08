"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Shield, History, UserCircle, Database, Layers, KeyRound, Bell, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/lib/mock/messaging";
import {
  STALE_DAYS, useApiKeys, useAudit, useCountryList, useCurrencies, useNotifications, usePaymentMethods, useRoles, useSectorList, useUsers,
} from "@/lib/mock/settings";
import { ago, daysSince, plural } from "./shared";

type Card = { href: string; icon: React.ElementType; title: string; description: string; stat: string };

export function SettingsHome() {
  const users = useUsers();
  const roles = useRoles();
  const auditLog = useAudit();
  const sectors = useSectorList();
  const countries = useCountryList();
  const currencies = useCurrencies();
  const methods = usePaymentMethods();
  const keys = useApiKeys();
  const rules = useNotifications();
  const templates = useTemplates();

  const active = users.filter((u) => u.status === "Active");
  const stale = active.filter((u) => u.lastActiveAt && daysSince(u.lastActiveAt) >= STALE_DAYS);
  const oldInvites = users.filter((u) => u.status === "Invited" && u.invitedAt && daysSince(u.invitedAt) >= 7);
  const admins = active.filter((u) => u.roleId === "admin");
  const typeGaps = sectors.filter((s) => s.active && !s.types.some((t) => t.active));
  const regionGaps = countries.filter((c) => c.enabled && c.expectedRegions > 0 && c.regions.length < c.expectedRegions);
  const misfit = rules.filter((n) => { const t = templates.find((x) => x.id === n.templateId); return n.enabled && t && n.expects !== "Internal" && t.category !== n.expects; });
  const unusedKeys = keys.filter((k) => k.status === "Active" && !k.lastUsedAt && daysSince(k.createdAt) >= 30);
  const last = auditLog[0];

  const attention = [
    admins.length < 2 && { text: admins.length === 1 ? `${admins[0].name} is the only active admin. Add a second so nobody gets locked out` : "There is no active admin", href: "/crm/settings/users?role=Admin" },
    stale.length && { text: `${stale.length} active user${stale.length === 1 ? " hasn't" : "s haven't"} signed in for ${STALE_DAYS}+ days`, href: "/crm/settings/users?view=stale" },
    oldInvites.length && { text: `${oldInvites.length} invite${oldInvites.length === 1 ? " is" : "s are"} over a week old and not accepted`, href: "/crm/settings/users?view=invited" },
    typeGaps.length && { text: `${typeGaps.map((s) => s.name).join(", ")} ${typeGaps.length === 1 ? "has" : "have"} no business types`, href: "/crm/settings/reference" },
    regionGaps.length && { text: `${regionGaps.map((c) => c.name).join(", ")}: ${regionGaps.length === 1 ? "its" : "their"} ${regionGaps.length === 1 ? plural(regionGaps[0].regionLabel.toLowerCase()) + " are" : "regions are"} incomplete`, href: "/crm/settings/reference?tab=locations" },
    misfit.length && { text: `${misfit.length} notification${misfit.length === 1 ? " uses" : "s use"} a template written for something else`, href: "/crm/settings/notifications" },
    unusedKeys.length && { text: `${unusedKeys.length} API key${unusedKeys.length === 1 ? " has" : "s have"} never been used`, href: "/crm/settings/api-keys" },
  ].filter(Boolean) as { text: string; href: string }[];

  const groups: { title: string; cards: Card[] }[] = [
    { title: "Team & access", cards: [
      { href: "/crm/settings/users", icon: Users, title: "Users", description: "Invite people, change roles, deactivate leavers", stat: `${active.length} active · ${users.filter((u) => u.status === "Invited").length} invited` },
      { href: "/crm/settings/roles", icon: Shield, title: "Roles & permissions", description: "What each role can see and change", stat: `${roles.length} roles · ${admins.length} admin${admins.length === 1 ? "" : "s"}` },
      { href: "/crm/settings/audit", icon: History, title: "Audit log", description: "Who changed what, and when", stat: last ? `Last change ${ago(last.at).toLowerCase()} by ${last.actor}` : "No changes yet" },
      { href: "/crm/settings/profile", icon: UserCircle, title: "My profile", description: "Your details and password", stat: "Name, phone, password" },
    ] },
    { title: "Business lists", cards: [
      { href: "/crm/settings/reference", icon: Database, title: "Reference data", description: "Sectors, locations, currencies and payment methods every form uses", stat: `${sectors.filter((s) => s.active).length} sectors · ${countries.filter((c) => c.enabled).length} countries · ${currencies.filter((c) => c.enabled).length} currencies · ${methods.filter((m) => m.enabled).length} payment methods` },
      { href: "/crm/service-type", icon: Layers, title: "Catalogue setup", description: "Service types, product types and bundle groups", stat: "3 lists" },
    ] },
    { title: "Integrations", cards: [
      { href: "/crm/settings/api-keys", icon: KeyRound, title: "Merchant API keys", description: "Keys that let merchants' systems connect to CICOD", stat: `${keys.filter((k) => k.status === "Active").length} active keys` },
      { href: "/crm/settings/notifications", icon: Bell, title: "Notifications", description: "Messages the CRM sends when something happens", stat: `${rules.filter((n) => n.enabled).length} of ${rules.length} on` },
    ] },
  ];

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Settings" subtitle="Who can use the CRM, the lists every form depends on, and how the CRM connects to other systems." />
      <div className="flex flex-col gap-8">

      <section aria-labelledby="attention" className={cn("rounded-xl border p-5", attention.length ? "border-[rgba(245,158,11,.35)] bg-[rgba(245,158,11,.04)]" : "border-[var(--border)] bg-[var(--card)]")}>
        <h2 id="attention" className="m-0 mb-3 text-[0.95rem] font-heading font-bold flex items-center gap-2">
          {attention.length ? <AlertTriangle className="w-4 h-4 text-[var(--warning)]" /> : <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
          {attention.length ? `Needs attention (${attention.length})` : "Nothing needs attention"}
        </h2>
        {attention.length > 0 && (
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {attention.map((a) => (
              <li key={a.text}><Link href={a.href} className="text-[0.88rem] flex items-center justify-between gap-4 hover:text-[var(--primary)] group"><span>{a.text}</span><ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" /></Link></li>
            ))}
          </ul>
        )}
      </section>

      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="m-0 mb-3 text-[0.78rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{g.title}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {g.cards.map((c) => (
              <Link key={c.href} href={c.href} className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5 flex gap-4 hover:border-[var(--primary)] transition-colors group">
                <span className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0"><c.icon className="w-5 h-5 text-[var(--primary)]" /></span>
                <span className="min-w-0">
                  <span className="block font-heading font-bold text-[0.98rem] group-hover:text-[var(--primary)]">{c.title}</span>
                  <span className="block text-[0.82rem] text-[var(--muted-foreground)] mt-0.5">{c.description}</span>
                  <span className="block text-[0.8rem] font-semibold mt-2">{c.stat}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="moved" className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <h2 id="moved" className="m-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] text-[0.95rem] font-heading font-bold">Where the old Settings pages went</h2>
        <table className="w-full text-[0.86rem] border-collapse">
          <tbody>
            {[
              ["Manage Users", "Users, with roles you can change and deactivation instead of delete"],
              ["Profile Settings", "My profile (open it from your avatar, top right)"],
              ["Business Setup (8 pages)", "Reference data: one page with four tabs; continents are a column, not a page"],
              ["Generate Merchant Key", "Merchant API keys: pick the customer, see issued keys, revoke them"],
              ["App Configuration › Triggers and Placeholders", "Notifications, and the variables in Messaging › Templates"],
              ["App Configuration › Sales Commission", "Partners › Commission plans (one plan per partner type)"],
              ["App Configuration › Service Keys", "The product codes in Catalogue (COM, WFM, UCG, IMS)"],
              ["App Configuration › Db Instances", "Removed: infrastructure belongs in deployment settings, not the CRM"],
            ].map(([from, to]) => (
              <tr key={from} className="border-t border-[var(--border)] first:border-t-0">
                <td className="px-6 py-3 font-semibold w-[38%] align-top">{from}</td>
                <td className="px-6 py-3 text-[var(--muted-foreground)]">{to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
    </div>
  );
}

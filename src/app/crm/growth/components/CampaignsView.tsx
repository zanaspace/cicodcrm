"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Mail, MessageSquare, Eye, Copy, Megaphone } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, daysFromToday, formatDate, newId } from "@/lib/format";
import { audienceLabel, campaignStatus, upsertCampaign, useCampaigns, type Campaign, type CampaignStatus } from "@/lib/mock/growth";
import { useTemplates } from "@/lib/mock/messaging";

const TABS: ("All" | CampaignStatus)[] = ["All", "Running", "Scheduled", "Draft", "Completed", "Cancelled"];
/** Campaign statuses mapped onto the shared badge colours. */
export const CAMPAIGN_BADGE: Record<CampaignStatus, string> = { Draft: "Draft", Scheduled: "trial", Running: "Live", Completed: "Archived", Cancelled: "Suspended" };

export function CampaignsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const campaigns = useCampaigns();
  const templates = useTemplates();
  const tab = (params.get("status") as (typeof TABS)[number]) ?? "All";
  const rows = campaigns.filter((c) => tab === "All" || campaignStatus(c) === tab);
  const count = (t: (typeof TABS)[number]) => campaigns.filter((c) => t === "All" || campaignStatus(c) === t).length;

  const duplicate = (c: Campaign) => {
    const id = newId("cmp");
    upsertCampaign({ ...c, id, name: `${c.name} (copy)`, draft: true, cancelled: false, startAt: null, endAt: null, results: undefined, createdBy: CURRENT_USER, createdAt: daysFromToday(0) });
    toast.success("Copied as a draft");
    router.push(`/crm/growth/campaigns/${id}`);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle="Who you're reaching, with what message, when, and what it achieved."
        actions={<Link href="/crm/growth/campaigns/new"><Button><Plus className="w-4 h-4 mr-2" /> New campaign</Button></Link>}
      />

      <div role="tablist" aria-label="Campaign status" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 mb-6">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => router.replace(t === "All" ? pathname : `${pathname}?status=${t}`, { scroll: false })}
            className={cn("flex-1 justify-center px-4 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all flex items-center gap-2", tab === t ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
            {t}<span className="min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold bg-[var(--card)]/60">{count(t)}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Campaign", "Status", "Audience", "Message", "Schedule", "Results"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Megaphone className="w-5 h-5 text-[var(--primary)]" /></div>
                    <p className="font-semibold m-0">No campaigns here</p>
                  </TableCell>
                </TableRow>
              ) : rows.map((c) => {
                const st = campaignStatus(c);
                const tpl = templates.find((t) => t.id === c.templateId);
                const r = c.results;
                return (
                  <TableRow key={c.id} onClick={() => router.push(`/crm/growth/campaigns/${c.id}`)} className="cursor-pointer group">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-semibold group-hover:text-[var(--primary)] max-w-[240px] truncate" title={c.name}>{c.name}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{c.goal}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={CAMPAIGN_BADGE[st]} label={st} /></TableCell>
                    <TableCell className="whitespace-nowrap text-[0.88rem]">{(() => { const [who, which] = audienceLabel(c.audience).split(" · "); return <><div>{who}</div>{which && <div className="text-[0.8rem] text-[var(--muted-foreground)]">{which}</div>}</>; })()}</TableCell>
                    <TableCell className="whitespace-nowrap text-[0.88rem]">
                      <span className="flex items-center gap-1.5 max-w-[200px] truncate">{c.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}{tpl?.name ?? <span className="text-[var(--muted-foreground)]">No template yet</span>}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem]">
                      {c.startAt ? <><div>{formatDate(c.startAt)}</div><div className="text-[0.8rem] text-[var(--muted-foreground)]">to {c.endAt ? formatDate(c.endAt) : "open-ended"}</div></> : <span className="text-[var(--muted-foreground)]">Not scheduled</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem]">
                      {r ? <><div><b>{r.delivered.toLocaleString()}</b> delivered</div><div className="text-[0.8rem] text-[var(--muted-foreground)]">{r.leads} leads · {r.won} won</div></> : <span className="text-[var(--muted-foreground)]">—</span>}
                    </TableCell>
                    <TableActionsCell>
                      <RowActionsMenu label={`Actions for ${c.name}`} actions={[
                        { label: st === "Draft" ? "Continue editing" : "View results", icon: Eye, onSelect: () => router.push(`/crm/growth/campaigns/${c.id}`) },
                        { label: "Duplicate as draft", icon: Copy, onSelect: () => duplicate(c) },
                      ]} />
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

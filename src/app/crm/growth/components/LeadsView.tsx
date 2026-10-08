"use client";

import { useUrlFlag } from "@/lib/useUrlFlag";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, LayoutList, Columns3, Eye, UserCheck, ArrowRight, ArrowLeft, XCircle, Inbox, X, Settings2, Shuffle, Hand } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, formatDate, formatMoney, formatRelative, daysUntil } from "@/lib/format";
import {
  LEAD_VIEWS, LOST_REASONS, OWNERS, SOURCES, assignLead, isOpenStage, markLost, moveLead, useLeads, useStages,
  type Lead, type PipelineStage,
} from "@/lib/mock/growth";
import { NewLeadDrawer } from "./NewLeadDrawer";
import { ManageStagesDrawer, MoveStageModal, StageBadge } from "./stages";

const ANY = "All";

export function LeadsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const leads = useLeads();
  const view = params.get("view") ?? "open";
  const layout = params.get("layout") === "board" ? "board" : "table";
  const source = params.get("source") ?? ANY;
  const owner = params.get("owner") ?? ANY;
  const page = Number(params.get("page") ?? 1);
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [pageSize, setPageSize] = React.useState(10);
  const [creating, setCreating] = useUrlFlag("new");
  const [losing, setLosing] = React.useState<Lead | null>(null);
  const [changing, setChanging] = React.useState<Lead | null>(null);
  const [managing, setManaging] = React.useState(false);
  const stages = useStages();

  const setParams = React.useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === ANY || (k === "view" && v === "open") || (k === "layout" && v === "table") || (k === "page" && v === "1")) next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  React.useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const t = setTimeout(() => setParams({ q: query }), 300);
    return () => clearTimeout(t);
  }, [query, params, setParams]);

  const base = leads.filter((l) => {
    const q = query.trim().toLowerCase();
    if (q && ![l.company, l.contact, l.email, l.phone, l.interest].join(" ").toLowerCase().includes(q)) return false;
    if (source !== ANY && l.source !== source) return false;
    if (owner !== ANY && (owner === "Unassigned" ? l.owner : l.owner !== owner)) return false;
    return true;
  });
  const counts = Object.fromEntries(LEAD_VIEWS.map((v) => [v.id, base.filter(v.test).length]));
  const rows = base.filter((LEAD_VIEWS.find((v) => v.id === view) ?? LEAD_VIEWS[0]).test)
    .sort((a, b) => (a.nextFollowUp ?? "9999").localeCompare(b.nextFollowUp ?? "9999") || b.createdAt.localeCompare(a.createdAt));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const open = (l: Lead) => router.push(`/crm/growth/leads/${l.id}`);
  const nextStage = (id: string) => { const i = stages.findIndex((s) => s.id === id); return i >= 0 ? stages[i + 1] : undefined; };
  const pipelineValue = base.filter((l) => isOpenStage(l.stage)).reduce((t, l) => t + l.estMonthly, 0);
  const move = (l: Lead, to: PipelineStage) => { moveLead(l.id, to.id); toast.success(`${l.company} moved to ${to.label}`); };

  const actionsFor = (l: Lead) => {
    const next = nextStage(l.stage);
    const isOpen = isOpenStage(l.stage);
    return [
      { label: "Open lead", icon: Eye, onSelect: () => open(l) },
      ...(next ? [{ label: `Move to ${next.label}`, icon: ArrowRight, onSelect: () => move(l, next) }] : []),
      ...(isOpen ? [{ label: "Change stage…", icon: Shuffle, onSelect: () => setChanging(l) }] : []),
      ...(l.owner !== CURRENT_USER && isOpen ? [{ label: "Assign to me", icon: UserCheck, onSelect: () => { assignLead(l.id, CURRENT_USER); toast.success(`${l.company} assigned to you`); } }] : []),
      ...(isOpen ? [{ label: "Mark as lost", icon: XCircle, danger: true, onSelect: () => setLosing(l) }] : []),
    ];
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Leads"
        subtitle="Every potential customer, from first contact to won. Website sign-ups land here unassigned."
        actions={<>
          <Button variant="outline" onClick={() => setManaging(true)}><Settings2 className="w-4 h-4 mr-2" /> Manage stages</Button>
          <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" /> New lead</Button>
        </>}
      />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div role="tablist" aria-label="Lead views" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg gap-1 overflow-x-auto">
          {LEAD_VIEWS.map((v) => {
            const active = view === v.id;
            const urgent = (v.id === "unassigned" || v.id === "followup") && counts[v.id] > 0;
            return (
              <button key={v.id} role="tab" aria-selected={active} onClick={() => setParams({ view: v.id })}
                className={cn("px-4 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all whitespace-nowrap flex items-center gap-2", active ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
                {v.label}
                <span className={cn("min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold", urgent ? "bg-[rgba(245,158,11,.15)] text-[var(--warning)]" : active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)]/60")}>{counts[v.id]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-[var(--muted)] p-1.5 rounded-lg" role="tablist" aria-label="Layout">
          {([["table", LayoutList, "Table"], ["board", Columns3, "Board"]] as const).map(([id, Icon, label]) => (
            <button key={id} role="tab" aria-selected={layout === id} onClick={() => setParams({ layout: id })}
              className={cn("px-3 py-2 rounded-md text-[0.85rem] font-semibold flex items-center gap-1.5", layout === id ? "bg-[var(--card)] shadow-sm text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end justify-between gap-4 flex-wrap border-b border-[var(--border)]">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead-search" className="text-[0.85rem] font-bold">Global Search</label>
              <div className="relative w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input id="lead-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Company, contact, email or phone"
                  className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]" />
              </div>
            </div>
            <Filter label="Source" value={source} options={[ANY, ...SOURCES.map((s) => s.name)]} onChange={(v) => setParams({ source: v })} />
            <Filter label="Owner" value={owner} options={[ANY, "Unassigned", ...OWNERS]} onChange={(v) => setParams({ owner: v })} />
            {(query || source !== ANY || owner !== ANY) && (
              <button onClick={() => { setQuery(""); setParams({ q: null, source: null, owner: null }); }} className="h-[2.8rem] px-2 text-[0.85rem] font-semibold text-[var(--primary)] flex items-center gap-1"><X className="w-4 h-4" /> Clear filters</button>
            )}
          </div>
          <div className="text-right">
            <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Open pipeline</div>
            <div className="font-heading font-extrabold text-[1.3rem]">{formatMoney(pipelineValue)}<span className="text-[0.8rem] font-medium text-[var(--muted-foreground)]">/month est.</span></div>
          </div>
        </div>

        {layout === "table" ? (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-none shadow-none rounded-none">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {["Lead", "Stage", "Interested in", "Owner and source", "Next follow-up"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                    <TableActionsHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Inbox className="w-5 h-5 text-[var(--primary)]" /></div>
                        <p className="font-semibold m-0">No leads in this view</p>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((l) => {
                    const due = l.nextFollowUp ? daysUntil(l.nextFollowUp) : null;
                    return (
                      <TableRow key={l.id} onClick={() => open(l)} className="cursor-pointer group">
                        <TableCell className="whitespace-nowrap">
                          <Link href={`/crm/growth/leads/${l.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold group-hover:text-[var(--primary)]">{l.company}</Link>
                          <div className="text-[0.8rem] text-[var(--muted-foreground)]">{l.contact}{l.designation ? ` · ${l.designation}` : ""}</div>
                        </TableCell>
                        <TableCell><StageBadge stage={l.stage} /></TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="max-w-[210px] truncate" title={l.interest}>{l.interest}</div>
                          <div className="text-[0.8rem] text-[var(--muted-foreground)]">{l.estMonthly ? `${formatMoney(l.estMonthly)}/mo est.` : "Value unknown"}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[0.88rem]">
                          <div>{l.owner ?? <span className="text-[var(--warning)] font-semibold">Unassigned</span>}</div>
                          <div className="text-[0.8rem] text-[var(--muted-foreground)]">via {l.source}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {l.nextFollowUp ? (
                            <>
                              <div className={cn("font-medium", due! < 0 && "text-[var(--destructive)]")}>{formatDate(l.nextFollowUp)}</div>
                              <div className="text-[0.8rem] text-[var(--muted-foreground)]">{formatRelative(l.nextFollowUp)}</div>
                            </>
                          ) : <span className="text-[0.85rem] text-[var(--muted-foreground)]">{isOpenStage(l.stage) ? "Not set" : "—"}</span>}
                        </TableCell>
                        <TableActionsCell><RowActionsMenu label={`Actions for ${l.company}`} actions={actionsFor(l)} /></TableActionsCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={(n) => setParams({ page: String(n) })} onPageSizeChange={(s) => { setPageSize(s); setParams({ page: null }); }} />
          </>
        ) : (
          <Board
            leads={base}
            stages={stages}
            onOpen={open}
            onMove={(l, to) => move(l, to)}
            onLose={setLosing}
            onWin={(l) => router.push(`/crm/growth/leads/${l.id}?convert=1`)}
            onManage={() => setManaging(true)}
          />
        )}
      </div>

      <MoveStageModal lead={changing} onClose={() => setChanging(null)} onConvert={() => changing && router.push(`/crm/growth/leads/${changing.id}?convert=1`)} onLose={() => setLosing(changing)} />
      {managing && <ManageStagesDrawer onClose={() => setManaging(false)} />}

      <NewLeadDrawer isOpen={creating} onClose={() => setCreating(false)} onCreated={(l) => router.push(`/crm/growth/leads/${l.id}`)} />
      <ConfirmDialog
        isOpen={!!losing}
        onClose={() => setLosing(null)}
        onConfirm={(r) => { if (losing) { markLost(losing.id, r?.reason ?? "Other", r?.note ?? ""); toast.success(`${losing.company} marked as lost`); } setLosing(null); }}
        tone="danger"
        icon={<XCircle className="w-6 h-6" />}
        title={`Mark ${losing?.company} as lost?`}
        description="The lead leaves the open pipeline. You can reopen it later from the Lost view."
        reasons={LOST_REASONS}
        confirmLabel="Mark as lost"
      />
    </div>
  );
}

/**
 * Board: one column per open stage, then Won and Lost.
 * Drag a card onto another column to move it, or use Prev / Next on the card (keyboard friendly).
 * Dropping on Won opens the conversion; dropping on Lost asks for a reason.
 */
function Board({ leads, stages, onOpen, onMove, onLose, onWin, onManage }: {
  leads: Lead[]; stages: PipelineStage[]; onOpen: (l: Lead) => void; onMove: (l: Lead, to: PipelineStage) => void;
  onLose: (l: Lead) => void; onWin: (l: Lead) => void; onManage: () => void;
}) {
  const [dragging, setDragging] = React.useState<Lead | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;

  // The dragged lead is read from the drag data on drop, so a fast drag never depends on a pending state update.
  const dropProps = (target: string, onDrop: (l: Lead) => void) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== target) setOver(target); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === target ? null : o)); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || dragging?.id;
      const lead = leads.find((l) => l.id === id);
      setOver(null); setDragging(null);
      if (lead && lead.stage !== target) onDrop(lead);
    },
  });
  const dropStyle = (target: string) => over === target ? "border-[var(--primary)] border-dashed bg-[var(--accent)]" : dragging && dragging.stage !== target ? "border-dashed" : "";

  return (
    <div className="p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 text-[0.82rem] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5"><Hand className="w-4 h-4" /> Drag a card to another stage, or use <b className="text-[var(--foreground)]">Prev</b> and <b className="text-[var(--foreground)]">Next</b> on the card.</span>
        <button type="button" onClick={onManage} className="font-semibold text-[var(--primary)] flex items-center gap-1"><Settings2 className="w-4 h-4" /> Manage stages</button>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(200px, 1fr)) 140px` }}>
          {stages.map((st, i) => {
            const items = leads.filter((l) => l.stage === st.id);
            const value = items.reduce((t, l) => t + l.estMonthly, 0);
            return (
              <section key={st.id} aria-label={st.label} {...dropProps(st.id, (l) => onMove(l, st))}
                className={cn("bg-[var(--background)] rounded-xl border-[1.5px] border-[var(--border)] flex flex-col min-h-[320px] transition-colors", dropStyle(st.id))}>
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <div className="font-heading font-bold text-[0.9rem] flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0"><StageBadge stage={st.id} /></span>
                    <span className="text-[0.75rem] text-[var(--muted-foreground)] font-semibold">{items.length}</span>
                  </div>
                  <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-1">{formatMoney(value)}/mo est.</div>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {items.length === 0 && <p className="m-0 py-6 text-center text-[0.78rem] text-[var(--muted-foreground)]">{dragging ? "Drop here" : "No leads"}</p>}
                  {items.map((l) => {
                    const prev = stages[i - 1];
                    const next = stages[i + 1];
                    return (
                      <article key={l.id} draggable
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); setDragging(l); }}
                        onDragEnd={() => { setDragging(null); setOver(null); }}
                        onClick={() => onOpen(l)}
                        className={cn("bg-[var(--card)] rounded-lg border border-[var(--border)] p-3 cursor-grab active:cursor-grabbing hover:border-[var(--primary)] transition-colors", dragging?.id === l.id && "opacity-50")}>
                        <div className="font-semibold text-[0.88rem]">{l.company}</div>
                        <div className="text-[0.75rem] text-[var(--muted-foreground)] truncate">{l.interest}</div>
                        <div className="mt-2 text-[0.75rem]"><span className={l.owner ? "text-[var(--muted-foreground)]" : "text-[var(--warning)] font-semibold"}>{l.owner ?? "Unassigned"}</span></div>
                        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[0.75rem]">
                          {prev ? (
                            <button onClick={(e) => { e.stopPropagation(); onMove(l, prev); }} className="font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-0.5" aria-label={`Move ${l.company} back to ${prev.label}`} title={`Back to ${prev.label}`}>
                              <ArrowLeft className="w-3 h-3" /> Prev
                            </button>
                          ) : <span />}
                          {next ? (
                            <button onClick={(e) => { e.stopPropagation(); onMove(l, next); }} className="font-semibold text-[var(--primary)] flex items-center gap-0.5" aria-label={`Move ${l.company} to ${next.label}`} title={`Move to ${next.label}`}>
                              Next <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); onWin(l); }} className="font-semibold text-[var(--success)] flex items-center gap-0.5" aria-label={`Convert ${l.company} to a customer`}>
                              Convert <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <div className="flex flex-col gap-3">
            <div {...dropProps("won", onWin)} className={cn("rounded-xl border-[1.5px] border-[var(--border)] p-4 transition-colors", dropStyle("won"))}>
              <div className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Won</div>
              <div className="font-heading font-extrabold text-[1.4rem] text-[var(--success)]">{won}</div>
              <div className="text-[0.72rem] text-[var(--muted-foreground)]">{dragging ? "Drop to convert" : "Converted to customers"}</div>
            </div>
            <div {...dropProps("lost", onLose)} className={cn("rounded-xl border-[1.5px] border-[var(--border)] p-4 transition-colors", dropStyle("lost"))}>
              <div className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Lost</div>
              <div className="font-heading font-extrabold text-[1.4rem]">{lost}</div>
              <div className="text-[0.72rem] text-[var(--muted-foreground)]">{dragging ? "Drop, then give a reason" : "Can be reopened"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}</span>
      <Select ariaLabel={label} value={value} onChange={onChange} options={options} className="w-[200px] h-[2.8rem]" searchable={options.length > 6} />
    </div>
  );
}


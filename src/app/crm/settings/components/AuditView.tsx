"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Download, History, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { CURRENT_USER } from "@/lib/format";
import { useAudit, type AuditArea } from "@/lib/mock/settings";
import { Avatar, SearchBox, dateTime } from "./shared";

const ANY_AREA = "All areas";
const ANY_PERSON = "Everyone";
const AREAS: AuditArea[] = ["Users", "Roles", "Profile", "Reference data", "API keys", "Notifications"];

/** Read-only: the log has no row actions, so there is no ⋯ column. */
export function AuditView() {
  const params = useSearchParams();
  const log = useAudit();
  const [query, setQuery] = React.useState("");
  const [area, setArea] = React.useState(ANY_AREA);
  const [person, setPerson] = React.useState(params.get("person") === "me" ? CURRENT_USER : ANY_PERSON);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const people = [...new Set(log.map((a) => a.actor))].sort();
  const q = query.trim().toLowerCase();
  const rows = log.filter((a) => (area === ANY_AREA || a.area === area) && (person === ANY_PERSON || a.actor === person) && (!q || `${a.action} ${a.target} ${a.detail ?? ""}`.toLowerCase().includes(q)));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const filtered = !!q || area !== ANY_AREA || person !== ANY_PERSON;

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = ["When,Who,Area,Action,Record,Details", ...rows.map((a) => [dateTime(a.at), a.actor, a.area, a.action, a.target, a.detail ?? ""].map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "crm-audit-log.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} entries`);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Audit log" subtitle="Every change made in Settings: who did it, to what, and when. Entries can't be edited or deleted."
        actions={<Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>} />
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end gap-4 flex-wrap border-b border-[var(--border)]">
          <SearchBox id="audit-search" value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Action, record or detail" />
          <div className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Area</span><Select ariaLabel="Area" value={area} onChange={(v) => { setArea(v); setPage(1); }} options={[ANY_AREA, ...AREAS]} className="w-[200px] h-[2.8rem]" /></div>
          <div className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Person</span><Select ariaLabel="Person" value={person} onChange={(v) => { setPerson(v); setPage(1); }} options={[ANY_PERSON, ...people]} className="w-[220px] h-[2.8rem]" /></div>
          {filtered && <button onClick={() => { setQuery(""); setArea(ANY_AREA); setPerson(ANY_PERSON); setPage(1); }} className="h-[2.8rem] px-2 text-[0.85rem] font-semibold text-[var(--primary)] flex items-center gap-1"><X className="w-4 h-4" /> Clear filters</button>}
        </div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader><TableRow className="hover:bg-transparent">{["When", "Who", "Area", "What happened", "Details"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><History className="w-5 h-5 text-[var(--primary)]" /></div>
                  <p className="font-semibold m-0">No changes match</p>
                </TableCell></TableRow>
              ) : pageRows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-[0.85rem]">{dateTime(a.at)}</TableCell>
                  <TableCell className="whitespace-nowrap"><span className="flex items-center gap-2.5"><Avatar name={a.actor} /><span className="text-[0.88rem] font-medium">{a.actor}</span></span></TableCell>
                  <TableCell><Badge variant="muted">{a.area}</Badge></TableCell>
                  <TableCell className="text-[0.88rem]"><b>{a.action}</b> · {a.target}</TableCell>
                  <TableCell className="text-[0.85rem] text-[var(--muted-foreground)] max-w-[380px]">{a.detail ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>
    </div>
  );
}
